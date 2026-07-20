import { WorkoutDay } from "@/types";

// Foundation (weeks 1-4): higher volume, moderate intensity, general
// strength + technique + landing mechanics before any real load goes on.
const foundationDays: WorkoutDay[] = [
  {
    day: "Monday",
    title: "Lower Body Foundation + Landing Mechanics",
    minutes: "45-60",
    notes: "Learn the patterns before adding load. Landing quietly matters more than anything else this month.",
    exercises: [
      "Heel-Elevated Goblet Squat",
      "Reverse Lunges",
      "Hip Thrust",
      "Lateral Band Walks",
      "Landing Mechanics Drill",
      "Tibialis Raises",
      "Calf Raises"
    ]
  },
  {
    day: "Tuesday",
    title: "Jump Prep + Speed Mechanics",
    minutes: "30-45",
    notes: "Jump quality over jump quantity. Land silent.",
    exercises: [
      "Pogo Hops",
      "Box Jumps",
      "Single-Leg Balance Reach",
      "Clamshells",
      "Sprint Starts"
    ]
  },
  {
    day: "Wednesday",
    title: "Upper Body Foundation + Core",
    minutes: "45-60",
    notes: "Build the base: pressing, pulling, and core control.",
    exercises: [
      "Pull-Ups",
      "DB Bench Press",
      "Single-Arm Row",
      "Landmine Press or DB Shoulder Press",
      "Face Pulls",
      "Y-T-W Raises",
      "Dead Bugs"
    ]
  },
  {
    day: "Thursday",
    title: "Mobility + Movement Prep",
    minutes: "20-30",
    notes: "Mobility day. Boring but useful. Tragic.",
    exercises: [
      "Full-Body Mobility Flow",
      "Deep Squat Holds",
      "Couch Stretch",
      "Shoulder CARs",
      "Hip CARs",
      "Ankle Rocks"
    ]
  },
  {
    day: "Friday",
    title: "Full Body Strength + Core",
    minutes: "45-60",
    notes: "General strength and core stability. No maxing out yet.",
    exercises: [
      "Trap Bar Deadlift or RDL",
      "Step-Ups",
      "Med Ball Rotational Throws",
      "Pallof Press",
      "Farmer Carries",
      "Side Planks"
    ]
  },
  {
    day: "Saturday",
    title: "Calisthenics + Conditioning Base",
    minutes: "45-60",
    notes: "Build a work capacity base for the phases ahead.",
    exercises: ["Bodyweight Rows", "Push-Ups", "Pike Push-Ups", "Planks", "Court Sprints"]
  },
  {
    day: "Sunday",
    title: "Rest + Reset",
    minutes: "20-30",
    rest: true,
    notes: "Recover. Adaptation happens when you rest.",
    exercises: ["Walk 20-30 minutes", "Light Stretching", "Foam Roll", "Light Shoulder Band Work"]
  }
];

// Build (weeks 5-8): increasing load, more sport-specific plyometrics.
const buildDays: WorkoutDay[] = [
  {
    day: "Monday",
    title: "Lower Body Strength + Knee Health",
    minutes: "45-60",
    notes: "Load is increasing. Technique still wins over ego. If knee pain is above 5/10, lower intensity.",
    exercises: [
      "Trap Bar Deadlift or RDL",
      "Bulgarian Split Squat",
      "Hip Thrust",
      "Spanish Squat",
      "Lateral Band Walks",
      "Tibialis Raises",
      "Calf Raises"
    ]
  },
  {
    day: "Tuesday",
    title: "Jump Power + Speed",
    minutes: "30-45",
    notes: "Start adding real jump volume now that landing mechanics are automatic.",
    exercises: ["Box Jumps", "Broad Jumps", "Lateral Bounds", "Single-Leg Balance Reach", "Sprint Starts"]
  },
  {
    day: "Wednesday",
    title: "Upper Body Power + Core",
    minutes: "45-60",
    notes: "Back, shoulder, and hitting power day.",
    exercises: [
      "Pull-Ups",
      "DB Bench Press",
      "Single-Arm Row",
      "Landmine Press or DB Shoulder Press",
      "Face Pulls",
      "Med Ball Rotational Throws",
      "Hanging Leg Raises"
    ]
  },
  {
    day: "Thursday",
    title: "Mobility + Recovery",
    minutes: "20-30",
    notes: "Mobility day. Boring but useful. Tragic.",
    exercises: ["Full-Body Mobility Flow", "Deep Squat Holds", "Couch Stretch", "Hip CARs", "Thoracic Rotations"]
  },
  {
    day: "Friday",
    title: "Explosive Full Body + Power",
    minutes: "45-60",
    notes: "Move fast. Do not turn power work into slow reps.",
    exercises: ["Push Press", "Med Ball Rotational Throws", "Cable Woodchoppers", "Dips"]
  },
  {
    day: "Saturday",
    title: "Calisthenics + Back Conditioning",
    minutes: "45-60",
    notes: "Main back and calisthenics strength day.",
    exercises: ["Pull-Ups", "Dips", "Bodyweight Rows", "Pike Push-Ups", "Farmer Carries", "Court Sprints"]
  },
  {
    day: "Sunday",
    title: "Rest + Reset",
    minutes: "20-30",
    rest: true,
    notes: "Recover. Adaptation happens when you rest.",
    exercises: ["Walk 20-30 minutes", "Light Stretching", "Foam Roll", "Light Shoulder Band Work"]
  }
];

// Power (weeks 9-16): lower volume, higher power/speed focus -- the
// advanced, most volleyball-specific and highest-impact work lives here,
// once a strength and landing-mechanics base has actually been built.
const powerDays: WorkoutDay[] = [
  {
    day: "Monday",
    title: "Lower Body Power + Knee Health",
    minutes: "45-60",
    notes: "Peak strength work. If knee pain is above 5/10, lower intensity.",
    exercises: [
      "Trap Bar Deadlift or RDL",
      "Bulgarian Split Squat",
      "Front Squat",
      "Spanish Squat",
      "Nordic Hamstring Curl",
      "Tibialis Raises"
    ]
  },
  {
    day: "Tuesday",
    title: "Jump Power + Speed",
    minutes: "30-45",
    notes: "Jump quality matters more than volume. This is peak power output.",
    exercises: ["Approach Jumps", "Box Jumps", "Broad Jumps", "Lateral Bounds", "Depth Drops", "Sprint Starts"]
  },
  {
    day: "Wednesday",
    title: "Upper Body Power + Core",
    minutes: "45-60",
    notes: "Back, shoulder, and hitting power day.",
    exercises: [
      "Pull-Ups",
      "DB Bench Press",
      "Single-Arm Row",
      "Push Press",
      "Face Pulls",
      "Med Ball Rotational Throws",
      "Ab Wheel Rollout"
    ]
  },
  {
    day: "Thursday",
    title: "Mobility + Recovery",
    minutes: "20-30",
    notes: "Mobility day. Boring but useful. Tragic.",
    exercises: [
      "Full-Body Mobility Flow",
      "Deep Squat Holds",
      "Couch Stretch",
      "Shoulder CARs",
      "Hip CARs",
      "Single-Leg Balance Reach"
    ]
  },
  {
    day: "Friday",
    title: "Explosive Full Body + Power",
    minutes: "45-60",
    notes: "Move fast. Do not turn power work into slow reps.",
    exercises: ["Push Press", "Med Ball Rotational Throws", "Drop Jumps", "Pull-Ups", "Dips", "Cable Woodchoppers"]
  },
  {
    day: "Saturday",
    title: "Calisthenics + Back Conditioning",
    minutes: "45-60",
    notes: "Main back and calisthenics strength day.",
    exercises: [
      "Pull-Ups",
      "Dips",
      "Bodyweight Rows",
      "Pike Push-Ups",
      "L-Sit Practice",
      "Handstand Practice",
      "Farmer Carries",
      "Court Sprints"
    ]
  },
  {
    day: "Sunday",
    title: "Rest + Reset",
    minutes: "20-30",
    rest: true,
    notes: "Recover. Adaptation happens when you rest.",
    exercises: ["Walk 20-30 minutes", "Light Stretching", "Foam Roll", "Light Shoulder Band Work"]
  }
];

// Taper (weeks 17-20): reduced volume, more mobility/prehab -- protecting
// against the accumulated-fatigue part of the season instead of chasing PRs.
const taperDays: WorkoutDay[] = [
  {
    day: "Monday",
    title: "Lower Body Maintenance + Knee Health",
    minutes: "35-45",
    notes: "Reduced volume. Stay sharp, not sore, heading into the final stretch.",
    exercises: ["Reverse Lunges", "Hip Thrust", "Spanish Squat", "Lateral Band Walks", "Clamshells", "Tibialis Raises"]
  },
  {
    day: "Tuesday",
    title: "Jump Maintenance + Speed",
    minutes: "25-35",
    notes: "Lower impact volume. Keep the jump quality, drop the pounding.",
    exercises: ["Pogo Hops", "Approach Jumps", "Single-Leg Balance Reach", "Landing Mechanics Drill"]
  },
  {
    day: "Wednesday",
    title: "Upper Body Maintenance + Shoulder Health",
    minutes: "35-45",
    notes: "Shoulder health takes priority after a full season of hitting.",
    exercises: [
      "DB Bench Press",
      "Single-Arm Row",
      "Face Pulls",
      "Band Pull-Aparts",
      "Y-T-W Raises",
      "External Rotations",
      "Dead Bugs"
    ]
  },
  {
    day: "Thursday",
    title: "Mobility + Recovery",
    minutes: "25-35",
    notes: "Extra mobility this phase. Your body has earned it.",
    exercises: [
      "Full-Body Mobility Flow",
      "Deep Squat Holds",
      "Couch Stretch",
      "Shoulder CARs",
      "Hip CARs",
      "Thoracic Rotations",
      "Ankle Rocks"
    ]
  },
  {
    day: "Friday",
    title: "Light Power Maintenance",
    minutes: "30-40",
    notes: "Stay explosive, stay healthy. This is not the week to chase a new PR.",
    exercises: ["Med Ball Rotational Throws", "Cable Woodchoppers", "Clamshells", "Single-Leg Balance Reach"]
  },
  {
    day: "Saturday",
    title: "Calisthenics + Conditioning",
    minutes: "30-40",
    notes: "Reduced volume calisthenics. Quality reps only.",
    exercises: ["Bodyweight Rows", "Push-Ups", "Planks", "Court Sprints"]
  },
  {
    day: "Sunday",
    title: "Rest + Reset",
    minutes: "20-30",
    rest: true,
    notes: "Recover. Adaptation happens when you rest.",
    exercises: ["Walk 20-30 minutes", "Light Stretching", "Foam Roll", "Light Shoulder Band Work"]
  }
];

export function getPhase(week: number) {
  if (week <= 4) {
    return {
      name: "Foundation Phase",
      focus: "Movement quality, general strength, and landing mechanics before load increases",
      sets: "2-3 sets",
      intensity: "Moderate"
    };
  }

  if (week <= 8) {
    return {
      name: "Build Phase",
      focus: "Increasing strength and introducing sport-specific plyometrics",
      sets: "3-4 sets",
      intensity: "Moderate-Heavy"
    };
  }

  if (week <= 16) {
    return {
      name: "Power Phase",
      focus: "Jump higher, hit harder, move faster -- lower volume, higher power output",
      sets: "3-5 sets",
      intensity: "High"
    };
  }

  return {
    name: "Taper Phase",
    focus: "Reduced volume, more mobility and prehab -- staying healthy through accumulated in-season fatigue",
    sets: "2-3 sets",
    intensity: "Light-Moderate"
  };
}

export function getWorkoutDays(week: number): WorkoutDay[] {
  if (week <= 4) return foundationDays;
  if (week <= 8) return buildDays;
  if (week <= 16) return powerDays;
  return taperDays;
}

const PHASE_REPRESENTATIVE_WEEK: Record<"foundation" | "build" | "power" | "taper", number> = {
  foundation: 1,
  build: 5,
  power: 9,
  taper: 17
};

export function getWorkoutDaysForPhase(phase: "foundation" | "build" | "power" | "taper"): WorkoutDay[] {
  return getWorkoutDays(PHASE_REPRESENTATIVE_WEEK[phase]);
}

export function getPrescription(week: number, exercise: string) {
  if (exercise.includes("Landing Mechanics")) return "3x5 quality landings";

  if (exercise.includes("Band Walk") || exercise.includes("Clamshell") || exercise.includes("Balance Reach")) {
    return "2-3x10-15 each side";
  }

  if (
    exercise.includes("Jump") ||
    exercise.includes("Bounds") ||
    exercise.includes("Sprints")
  ) {
    if (week <= 4) return "3x3";
    if (week <= 8) return "4x3";
    if (week <= 16) return "5x3";
    return "3x3";
  }

  if (
    exercise.includes("Mobility") ||
    exercise.includes("Stretch") ||
    exercise.includes("CARs")
  ) {
    return "10-20 min";
  }

  if (exercise.includes("Spanish")) return "3x30-45 sec";

  if (week <= 4) return "2-3x10";
  if (week <= 8) return "3-4x8";
  if (week <= 12) return "4x6";
  if (week <= 16) return "4-5x5";
  return "2-3x8";
}
