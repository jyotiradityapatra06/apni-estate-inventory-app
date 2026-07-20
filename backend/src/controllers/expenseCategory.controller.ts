import { NextFunction, Request, Response } from "express";
import * as service from "../services/expenseCategory.service";
const context = (req: Request) => ({ businessId: req.user!.businessId, userId: req.user!.userId });
export const list = async (req: Request, res: Response, next: NextFunction) => { try { const ctx = context(req); res.json({ success: true, data: await service.list(ctx.businessId, ctx.userId, req.query) }); } catch (error) { next(error); } };
export const create = async (req: Request, res: Response, next: NextFunction) => { try { const ctx = context(req); res.status(201).json({ success: true, data: await service.create(ctx.businessId, ctx.userId, req.body) }); } catch (error) { next(error); } };
export const update = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.update(context(req).businessId, req.params.id, req.body) }); } catch (error) { next(error); } };
export const deactivate = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.deactivate(context(req).businessId, req.params.id) }); } catch (error) { next(error); } };
