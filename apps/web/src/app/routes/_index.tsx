import { redirect } from "react-router";

export async function loader() {
  throw redirect("/admin");
}

export default function IndexPage() {
  return null;
}
