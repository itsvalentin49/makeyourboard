import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const THUMB_BUCKET = "pedals-thumbs";

const TABLES = ["pedals", "power"];

async function generateForTable(tableName: string) {
  const { data: items, error } = await supabase
    .from(tableName)
    .select("id, image, thumbnail")
    .is("thumbnail", null);

  if (error) {
    console.error(`Erreur table ${tableName}:`, error.message);
    return;
  }

  console.log(`${tableName} à traiter : ${items?.length || 0}`);

  for (const item of items || []) {
    if (!item.image) continue;

    const filename = item.image.split("/").pop()?.split("?")[0];
    if (!filename) continue;

    console.log(`[${tableName}] Création :`, filename);

    const response = await fetch(item.image);
    if (!response.ok) {
      console.error(`[${tableName}] Impossible de télécharger :`, item.image);
      continue;
    }

    const arrayBuffer = await response.arrayBuffer();

    const thumbBuffer = await sharp(Buffer.from(arrayBuffer))
      .resize(140, 140, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 60 })
      .toBuffer();

    const thumbPath = filename.replace(/\.[^.]+$/, ".webp");

    const { error: uploadError } = await supabase.storage
      .from(THUMB_BUCKET)
      .upload(thumbPath, thumbBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error(`[${tableName}] Erreur upload :`, filename, uploadError.message);
      continue;
    }

    const { data: publicData } = supabase.storage
      .from(THUMB_BUCKET)
      .getPublicUrl(thumbPath);

    const { error: updateError } = await supabase
      .from(tableName)
      .update({ thumbnail: publicData.publicUrl })
      .eq("id", item.id);

    if (updateError) {
      console.error(`[${tableName}] Erreur update DB :`, filename, updateError.message);
      continue;
    }

    console.log(`[${tableName}] OK :`, filename);
  }
}

async function main() {
  for (const table of TABLES) {
    await generateForTable(table);
  }

  console.log("Terminé.");
}

main();