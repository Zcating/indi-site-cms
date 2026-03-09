import { redirect } from "react-router";
import type { Route } from "./+types/_index";

export async function loader() {
  throw redirect("/admin");
}

export default function IndexPage(_props: Route.ComponentProps) {
  return null;
}
