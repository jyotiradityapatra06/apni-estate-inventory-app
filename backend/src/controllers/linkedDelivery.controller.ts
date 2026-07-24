import { NextFunction, Request, Response } from "express";
import * as service from "../services/linkedDelivery.service";

const businessId = (req: Request) => req.user!.businessId;
const userId = (req: Request) => req.user!.userId;

export const getAll = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.getAll(businessId(req), req.query, req.user) }); } catch (error) { next(error); } };
export const getById = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.getById(businessId(req), req.params.id, req.user) }); } catch (error) { next(error); } };
export const getDeliverableItems = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await service.getDeliverableItems(businessId(req), req.params.id) }); } catch (error) { next(error); } };
export const create = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json({ success: true, message: "Linked delivery created.", data: await service.create(businessId(req), userId(req), req.body) }); } catch (error) { next(error); } };
export const markReady = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: "Delivery is ready for dispatch.", data: await service.markReady(businessId(req), req.params.id, req.body) }); } catch (error) { next(error); } };
export const dispatch = async (req: Request, res: Response, next: NextFunction) => { try { const result = await service.dispatch(businessId(req), userId(req), req.params.id, req.body); res.json({ success: true, message: result.idempotentReplay ? "Delivery was already dispatched." : "Delivery dispatched and stock posted.", idempotentReplay: result.idempotentReplay, data: result.delivery }); } catch (error) { next(error); } };
export const complete = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: "Delivery confirmation recorded.", data: await service.complete(businessId(req), userId(req), req.params.id, req.body) }); } catch (error) { next(error); } };
export const cancel = async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, message: "Delivery cancelled.", data: await service.cancel(businessId(req), userId(req), req.params.id, req.body) }); } catch (error) { next(error); } };
export const reverseDispatch = async (req: Request, res: Response, next: NextFunction) => { try { const result = await service.reverseDispatch(businessId(req), userId(req), req.params.id, req.body); res.json({ success: true, message: result.idempotentReplay ? "Dispatch was already reversed." : "Dispatch reversed and stock restored.", idempotentReplay: result.idempotentReplay, data: result.delivery }); } catch (error) { next(error); } };
