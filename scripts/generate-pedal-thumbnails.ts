import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const THUMB_BUCKET = "pedals-thumbs";

async function main() {
  const { data: pedals, error } = await supabase
    .from("pedals")
    .select("id, image, thumbnail")
    .is("thumbnail", null);

  if (error) {
    throw error;
  }

  console.log(`Pédales à traiter : ${pedals?.length || 0}`);

  for (const pedal of pedals || []) {
    if (!pedal.image) continue;

    const filename = pedal.image.split("/").pop()?.split("?")[0];

    if (!filename) continue;

    console.log("Création :", filename);

    const response = await fetch(pedal.image);

    if (!response.ok) {
      console.error("Impossible de télécharger :", pedal.image);
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
      console.error("Erreur upload :", filename, uploadError.message);
      continue;
    }

    const { data: publicData } = supabase.storage
      .from(THUMB_BUCKET)
      .getPublicUrl(thumbPath);

    const { error: updateError } = await supabase
      .from("pedals")
      .update({ thumbnail: publicData.publicUrl })
      .eq("id", pedal.id);

    if (updateError) {
      console.error("Erreur update DB :", filename, updateError.message);
      continue;
    }

    console.log("OK :", filename);
  }

  console.log("Terminé.");
}

main();