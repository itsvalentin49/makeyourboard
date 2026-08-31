import { headers } from "next/headers";
import BoardEditor from "@/components/BoardEditor";

export default async function Page() {
  const headersList = await headers();

  const country =
    headersList.get("x-vercel-ip-country")?.toUpperCase() || "";

  return (
    <BoardEditor initialCountry={country} />
  );
}