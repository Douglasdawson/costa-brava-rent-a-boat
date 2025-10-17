import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/hooks/use-language";
import { routes } from "./routes";

export async function render(url: string, context: any) {
  const { query, dataRoutes } = createStaticHandler(routes);
  const fetchRequest = new Request(url);
  const routeContext = await query(fetchRequest);

  if (routeContext instanceof Response) {
    throw routeContext;
  }

  const router = createStaticRouter(dataRoutes, routeContext);
  const helmetContext = {};

  const app = (
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <StaticRouterProvider router={router} context={routeContext} />
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );

  return { app, helmetContext };
}
