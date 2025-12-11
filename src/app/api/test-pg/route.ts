import { Analytics } from "@/lib/analytics";

export async function POST(req: Request) {
  const values = await req.json();
  const result = await Analytics.computePgGrade(values);
  return Response.json(result);
}
