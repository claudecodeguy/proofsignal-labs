/**
 * Company query helpers — read from DB in production,
 * fall back to mock data if DB is unavailable (dev without DB).
 */

import { db } from "@/lib/db";
import { COMPANIES as MOCK_COMPANIES, DASHBOARD_STATS } from "@/lib/mock-data";

export type CompanySummary = {
  id: string;
  name: string;
  domain: string;
  city: string | null;
  state: string | null;
  status: string;
  confidenceScore: number;
  discoverySource: string;
  discoveredAt: string;
  locationCount: number | null;
};

export type DashboardCounts = {
  totalCompanies: number;
  approvedLeads: number;
  borderlineLeads: number;
  rejectedLeads: number;
  totalBuyers: number;
  activeExclusivityLocks: number;
};

async function dbAvailable(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function getCompanies(filters?: {
  status?: string;
  state?: string;
  source?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ companies: CompanySummary[]; total: number }> {
  if (!(await dbAvailable())) {
    // Return mock data if DB not connected
    const filtered = MOCK_COMPANIES.filter((c) => {
      if (filters?.status && c.status !== filters.status) return false;
      if (filters?.state && c.state !== filters.state) return false;
      if (filters?.source && c.discoverySource !== filters.source) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.domain.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    return {
      companies: filtered.map((c) => ({
        id: c.id,
        name: c.name,
        domain: c.domain,
        city: c.city,
        state: c.state,
        status: c.status,
        confidenceScore: c.confidenceScore,
        discoverySource: c.discoverySource,
        discoveredAt: c.discoveredAt,
        locationCount: c.locationCount,
      })),
      total: filtered.length,
    };
  }

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 50;

  const where: Record<string, unknown> = {};
  if (filters?.status) where.validationStatus = filters.status;
  if (filters?.state) where.state = filters.state;
  if (filters?.source) where.discoverySource = filters.source;
  if (filters?.search) {
    where.OR = [
      { companyName: { contains: filters.search, mode: "insensitive" } },
      { domain: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    db.companyRaw.count({ where }),
    db.companyRaw.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        companyName: true,
        domain: true,
        city: true,
        state: true,
        validationStatus: true,
        confidenceScore: true,
        discoverySource: true,
        createdAt: true,
        locationCountEstimate: true,
      },
    }),
  ]);

  return {
    companies: rows.map((r) => ({
      id: r.id,
      name: r.companyName,
      domain: r.domain,
      city: r.city,
      state: r.state,
      status: r.validationStatus,
      confidenceScore: r.confidenceScore,
      discoverySource: r.discoverySource,
      discoveredAt: r.createdAt.toISOString(),
      locationCount: r.locationCountEstimate,
    })),
    total,
  };
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  if (!(await dbAvailable())) {
    return {
      totalCompanies: DASHBOARD_STATS.totalCompanies,
      approvedLeads: DASHBOARD_STATS.approvedLeads,
      borderlineLeads: DASHBOARD_STATS.borderlineLeads,
      rejectedLeads: DASHBOARD_STATS.rejectedLeads,
      totalBuyers: DASHBOARD_STATS.totalBuyers,
      activeExclusivityLocks: DASHBOARD_STATS.activeExclusivityLocks,
    };
  }

  const [totalCompanies, approvedLeads, borderlineLeads, rejectedLeads, totalBuyers, activeExclusivityLocks] =
    await Promise.all([
      db.companyRaw.count(),
      db.companyRaw.count({ where: { validationStatus: "approved" } }),
      db.companyRaw.count({ where: { validationStatus: "borderline" } }),
      db.companyRaw.count({ where: { validationStatus: "rejected" } }),
      db.buyer.count(),
      db.exclusivityLock.count({ where: { active: true, expiresAt: { gt: new Date() } } }),
    ]);

  return { totalCompanies, approvedLeads, borderlineLeads, rejectedLeads, totalBuyers, activeExclusivityLocks };
}

export async function getActiveVerticalId(): Promise<string | null> {
  if (!(await dbAvailable())) return null;
  const setting = await db.setting.findUnique({ where: { key: "active_vertical" } });
  return setting?.value ?? null;
}
