import { Request, Response, NextFunction } from "express";
import * as service from "../services/customer.service";

const businessId = (req: Request) => req.user!.businessId;
export const getAll = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.getAll(businessId(req), { search: req.query.search as string, active: req.query.active as string }) }); } catch (e) { next(e); } };
export const getById = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.getById(businessId(req), req.params.id) }); } catch (e) { next(e); } };
export const create = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json({ success: true, message: "Customer created successfully.", data: await service.create(businessId(req), req.body) }); } catch (e) { next(e); } };
export const update = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: "Customer updated successfully.", data: await service.update(businessId(req), req.params.id, req.body) }); } catch (e) { next(e); } };
export const remove = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: "Customer deactivated successfully.", data: await service.remove(businessId(req), req.params.id) }); } catch (e) { next(e); } };
