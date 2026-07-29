import { createFileRoute } from "@tanstack/react-router";
import { PortfolioView } from "@/components/portfolio-view";

export const Route = createFileRoute("/")({
  component: PortfolioView,
});
