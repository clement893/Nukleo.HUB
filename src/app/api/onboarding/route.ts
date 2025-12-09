import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les étapes d'onboarding pour un employé
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const role = searchParams.get("role");

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId requis" }, { status: 400 });
    }

    // Récupérer les étapes d'onboarding (globales + spécifiques au rôle)
    const steps = await prisma.onboardingStep.findMany({
      where: {
        OR: [
          { role: null },
          { role: role || undefined }
        ]
      },
      orderBy: { order: "asc" },
      include: {
        progress: {
          where: { employeeId }
        }
      }
    });

    // Récupérer les politiques actives
    const policies = await prisma.policy.findMany({
      where: { isActive: true },
      include: {
        acknowledgments: {
          where: { employeeId }
        }
      }
    });

    // Récupérer l'employé
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    // Calculer la progression globale
    const totalSteps = steps.length;
    const completedSteps = steps.filter(s => 
      s.progress.some(p => p.status === "completed")
    ).length;
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Politiques non reconnues
    const pendingPolicies = policies.filter(p => 
      p.requiresAck && p.acknowledgments.length === 0
    );

    return NextResponse.json({
      employee,
      steps: steps.map(s => ({
        ...s,
        status: s.progress[0]?.status || "pending",
        completedAt: s.progress[0]?.completedAt
      })),
      policies,
      pendingPolicies,
      progress: {
        total: totalSteps,
        completed: completedSteps,
        percent: progressPercent
      },
      isComplete: employee?.onboardingCompleted || false
    });
  } catch (error) {
    console.error("Erreur onboarding GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Mettre à jour la progression d'une étape
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, stepId, status, score } = body;

    if (!employeeId || !stepId) {
      return NextResponse.json({ error: "employeeId et stepId requis" }, { status: 400 });
    }

    // Upsert la progression
    const progress = await prisma.onboardingProgress.upsert({
      where: {
        employeeId_stepId: { employeeId, stepId }
      },
      update: {
        status,
        completedAt: status === "completed" ? new Date() : null,
        score
      },
      create: {
        employeeId,
        stepId,
        status,
        completedAt: status === "completed" ? new Date() : null,
        score
      }
    });

    // Vérifier si toutes les étapes sont complétées
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    const allSteps = await prisma.onboardingStep.findMany({
      where: {
        OR: [
          { role: null },
          { role: employee?.department }
        ],
        isRequired: true
      }
    });

    const completedProgress = await prisma.onboardingProgress.findMany({
      where: {
        employeeId,
        status: "completed"
      }
    });

    const allPolicies = await prisma.policy.findMany({
      where: { isActive: true, requiresAck: true }
    });

    const acknowledgedPolicies = await prisma.policyAcknowledgment.findMany({
      where: { employeeId }
    });

    const allStepsCompleted = allSteps.every(step =>
      completedProgress.some(p => p.stepId === step.id)
    );

    const allPoliciesAcknowledged = allPolicies.every(policy =>
      acknowledgedPolicies.some(a => a.policyId === policy.id)
    );

    // Marquer l'onboarding comme terminé si tout est fait
    if (allStepsCompleted && allPoliciesAcknowledged && !employee?.onboardingCompleted) {
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date()
        }
      });
    }

    return NextResponse.json({ progress, allStepsCompleted, allPoliciesAcknowledged });
  } catch (error) {
    console.error("Erreur onboarding POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
