import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { sendWeeklyLogReminder, sendMidReportNotification } from "@/utils/mailer";
import { differenceInWeeks, addWeeks } from "date-fns";
import { calculateTotalWeeks, calculateCurrentWeek } from "@/utils/internship-dates";

export async function GET() {
  try {
    // Get all active internships with their related data
    const internships = await prisma.internship.findMany({
      where: { 
        status: "APPROVED" // Using the actual enum value from schema
      },
      include: {
        student: true,
        site: true,
      //  assignment: true,
        weeklyLogs: {
          orderBy: {
            weekNo: 'desc'
          },
          take: 1
        }
      }
    });

    const now = new Date();
    let remindersSent = 0;
    let midReportNotifications = 0;

    for (const internship of internships) {
      // Skip if no start date or end date
      if (!internship.startDate || !internship.endDate) {
        continue;
      }

      // Calculate total weeks from start and end dates
      const totalWeeks = calculateTotalWeeks(internship.startDate, internship.endDate);

      // Skip if totalWeeks is 0 or invalid
      if (totalWeeks <= 0) {
        continue;
      }

      // Calculate current week
      const currentWeek = calculateCurrentWeek(internship.startDate, now);

      // Check if internship is still ongoing
      if (currentWeek > 0 && currentWeek <= totalWeeks) {
        // Check if student needs to submit a weekly log
        const lastSubmittedWeek = internship.weeklyLogs[0]?.weekNo || 0;

        // Send reminder if student hasn't submitted current week's log
        if (currentWeek > lastSubmittedWeek) {
          try {
            await sendWeeklyLogReminder(
              internship.student.email,
              internship.student.name || 'Student',
              currentWeek
            );
            remindersSent++;
          } catch (error) {
            console.error(`Failed to send reminder to ${internship.student.email}:`, error);
          }
        }
      }

      // Check for mid-report notification
      const midPoint = addWeeks(internship.startDate, Math.floor(totalWeeks / 2));
      
      // Check if we're at or past the midpoint and haven't sent mid-report notification yet
      if (now >= midPoint && internship.site) {
        // You might want to add a field to track if mid-report notification was sent
        // For now, we'll send it every time (you can add a database field to track this)
        try {
          await sendMidReportNotification(
            internship.site.email,
            internship.site.name || 'Supervisor',
            internship.student.name || 'Student'
          );
          midReportNotifications++;
        } catch (error) {
          console.error(`Failed to send mid-report notification to ${internship.site.email}:`, error);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Weekly reminders processed successfully`,
      remindersSent,
      midReportNotifications,
      totalInternships: internships.length
    });

  } catch (error) {
    console.error("Error processing weekly reminders:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to process weekly reminders",
        error: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}
