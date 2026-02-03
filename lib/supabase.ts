import { createClient } from '@supabase/supabase-js';

// On récupère les clés depuis le fichier .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Sécurité : on vérifie que les clés sont bien présentes
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERREUR: Les variables d'environnement Supabase sont manquantes !");
}

// On crée et on exporte le client unique
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);