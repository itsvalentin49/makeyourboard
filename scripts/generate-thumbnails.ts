import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

dotenv.config({ path: ".env.local" });

const THUMB_BUCKET = "thumbnails";
const TABLES = ["pedals", "power", "boards"] as const;
type TableName = (typeof TABLES)[number];
type Item = {
  id: number | string;
  image: string | null;
  thumbnail: string | null;
  width: number | string | null;
  depth: number | string | null;
};

const runId = Date.now().toString();

function getThumbSize(tableName: TableName, item: Item) {
  const width = Number(item.width) || 0;
  const depth = Number(item.depth) || 0;
  const isHorizontal = width > 0 && depth > 0 && width > depth;
  const isVertical = width > 0 && depth > 0 && depth > width;

  if (tableName === "power") {
    return isVertical
      ? { width: 140, height: 220 }
      : { width: 320, height: 120 };
  }
  if (tableName === "boards") return { width: 320, height: 140 };
  if (isHorizontal) return { width: 240, height: 140 };
  return { width: 140, height: 140 };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Variables Supabase manquantes dans .env.local.");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: bucket, error: bucketError } =
    await supabase.storage.getBucket(THUMB_BUCKET);
  if (bucketError || !bucket) {
    throw new Error(`Bucket thumbnails introuvable : ${bucketError?.message ?? ""}`);
  }
  if (!bucket.public) throw new Error("Le bucket thumbnails doit être public.");

  // Read all tables before changing any URLs. Do not filter on thumbnail.
  const catalog: { table: TableName; items: Item[] }[] = [];
  for (const table of TABLES) {
    const items: Item[] = [];
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase
        .from(table)
        .select("id, image, thumbnail, width, depth")
        .order("id", { ascending: true })
        .range(offset, offset + 499);
      if (error) throw new Error(`Lecture ${table} : ${error.message}`);
      const page = (data ?? []) as Item[];
      if (page.length === 0) break;
      items.push(...page);
      offset += page.length;
    }
    catalog.push({ table, items });
  }

  const backupDir = path.resolve("thumbnail-backups");
  await mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `before-${runId}.json`);
  await writeFile(backupPath, JSON.stringify(catalog, null, 2), "utf8");
  console.log(`Sauvegarde des anciens liens : ${backupPath}`);

  let success = 0;
  let failed = 0;
  let skipped = 0;
  const failures: { table: TableName; id: Item["id"]; error: string }[] = [];

  for (const { table, items } of catalog) {
    console.log(`\n${table} : ${items.length} produits à examiner`);
    for (const item of items) {
      if (!item.image?.trim()) {
        skipped++;
        console.log(`[${table} #${item.id}] Ignoré : aucune image originale.`);
        continue;
      }

      try {
        const response = await fetch(item.image, {
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) throw new Error(`Téléchargement HTTP ${response.status}`);
        const original = Buffer.from(await response.arrayBuffer());
        const size = getThumbSize(table, item);
        const thumbnail = await sharp(original)
          .trim({
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            threshold: 10,
          })
          .resize({ ...size, fit: "inside", withoutEnlargement: false })
          .webp({ quality: 60 })
          .toBuffer();

        // Table + ID avoids collisions between identical source filenames.
        // A new path per run also avoids serving an older cached image.
        const thumbPath = `${table}-${encodeURIComponent(String(item.id))}-${runId}.webp`;
        const { error: uploadError } = await supabase.storage
          .from(THUMB_BUCKET)
          .upload(thumbPath, thumbnail, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: false,
          });
        if (uploadError) throw new Error(`Upload : ${uploadError.message}`);

        const { data: publicData } = supabase.storage
          .from(THUMB_BUCKET)
          .getPublicUrl(thumbPath);

        // Preserve concurrent edits to either the original image or old URL.
        let update = supabase.from(table)
          .update({ thumbnail: publicData.publicUrl })
          .eq("id", item.id)
          .eq("image", item.image);
        update = item.thumbnail === null
          ? update.is("thumbnail", null)
          : update.eq("thumbnail", item.thumbnail);
        const { data: updated, error: updateError } = await update.select("id");
        if (updateError) throw new Error(`Mise à jour : ${updateError.message}`);
        if (updated?.length !== 1) {
          throw new Error("Produit modifié pendant le traitement : lien conservé.");
        }
        success++;
        console.log(`[${table} #${item.id}] OK (${size.width} × ${size.height})`);
      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ table, id: item.id, error: message });
        console.error(`[${table} #${item.id}] ÉCHEC : ${message}`);
      }
    }
  }

  const reportPath = path.join(backupDir, `report-${runId}.json`);
  await writeFile(reportPath, JSON.stringify({
    success, failed, skipped, failures,
  }, null, 2), "utf8");
  console.log(`\nTerminé : ${success} réussites, ${failed} échecs, ${skipped} sans image.`);
  console.log(`Rapport : ${reportPath}`);
  if (failed || skipped) {
    console.log("Conserve pedals-thumbs : certains produits n’ont pas reçu de nouvelle miniature.");
    process.exitCode = 1;
  } else {
    console.log("Toutes les miniatures du catalogue ont été régénérées dans thumbnails.");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
