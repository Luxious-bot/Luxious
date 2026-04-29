import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    service: "Luxious",
    timestamp: new Date().toISOString(),
  });
});

export default router;
