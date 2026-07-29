import { createFileRoute } from "@tanstack/react-router";
import { ManageMarkets } from "@/components/manage-markets";

export const Route = createFileRoute("/manage")({
  component: ManageMarkets,
});
