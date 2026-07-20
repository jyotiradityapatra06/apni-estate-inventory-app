import { Request, Response, NextFunction } from "express";
import * as service from "../services/salesOrder.service";
const bid = (req: Request) => req.user!.businessId;
export const getAll = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.getAll(bid(req), req.query) }); } catch (error) { next(error); } };
export const getById = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.getById(bid(req), req.params.id) }); } catch (error) { next(error); } };
export const create = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json({ success: true, message: "Sales Order created as draft.", data: await service.create(bid(req), req.user!.userId, req.body) }); } catch (error) { next(error); } };
export const confirm = async (req: Request, res: Response, next: NextFunction) => { try { const override=req.body?.creditLimitOverride===true; if(override&&!['OWNER','MANAGER'].includes(req.user!.role)) throw new Error('Credit override is not allowed.'); res.json({ success: true, message: "Sales Order confirmed and stock reserved.", data: await service.confirm(bid(req), req.params.id,override) }); } catch (error) { next(error); } };
export const cancel = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: "Sales Order cancelled and reservations released.", data: await service.cancel(bid(req), req.params.id) }); } catch (error) { next(error); } };
