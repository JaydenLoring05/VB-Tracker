# Exercise catalog research: evidence-based spot-check + 8 new entries

Companion to `2026-07-18-elevateos-refresh-design.md`, section B "Data / content."
Research only — no files edited yet; this feeds the implementation plan.

Sourcing caveat: direct, citable Jeff Nippard content was only findable for two
topics (glute/hip-thrust exercise ranking, Nordic-curl form cues). Everything
else below leans on the broader sports-science literature he typically draws
from, not a confirmed Nippard-specific statement.

## Spot-check of existing `purpose` claims

| Exercise | Current claim | Verdict | Fix |
|---|---|---|---|
| Nordic Hamstring Curl | "elite hamstring strength and injury resistance" | Accurate — meta-analyses show ~50% reduction in hamstring injury rate via fascicle-length adaptation. | No change. |
| Hip Thrust | "glute strength for jumping, sprinting, hip extension power" | Accurate — Nippard's glute-exercise ranking puts hip thrust at/near the top for glute activation and glute:quad ratio. | No change. |
| Spanish Squat | "quad and patellar tendon tolerance for knee health" | Accurate — isometric quad loading at mid-length reduces patellar tendon pain acutely (in-season isometrics RCT); Spanish squat is the standard delivery method. | No change. |
| Pallof Press | "anti-rotation core strength for hitting stability" | Accurate — RCT found anti-rotation training beat dynamic core training on oblique activation/neuromuscular efficiency. | No change. |
| Lateral Band Walks | "weak hip abductors are one of the biggest modifiable risk factors for knee valgus collapse" | Overstated — 2012 systematic review found the strength→valgus link inconsistent; 2021 work suggests rate of force development matters more than max isometric strength. | **Reword** (see design doc). |
| Single-Leg Balance Reach | "ACL-prevention research consistently pairs balance training with strength training, not strength alone" | Backwards emphasis — meta-analyses of multicomponent ACL-prevention programs found plyometric + strengthening components more predictive than the balance component. | **Reword** (see design doc). |
| Reverse Sled Drag | "quad strength and knee blood flow with low joint stress" | Fine — standard low-impact quad-loading tool in ACL rehab protocols. | No change. |
| Tibialis Raises | "shin strength for knee and ankle durability" | Reasonable, low-controversy claim. | No change. |
| Med Ball Rotational Throws / Cable Woodchoppers / Landmine Rotations | "rotational power for harder hitting" | Fine — standard S&C consensus on rotational-power transfer to striking/throwing sports. | No change. |
| Approach Jumps / Box Jumps / Broad Jumps / Drop Jumps / Pogo Hops | stretch-shortening-cycle / explosive-power claims | Fine — matches SSC literature directly (elastic energy storage, reactive strength index gains). | No change. |

No solid source found specifically discussing Reverse Sled Drag, Tibialis
Raises, or the rotational-core exercises from Nippard directly — relied on
general physio/S&C literature for those; nothing in them warranted a change.

## 8 new catalog entries (ready to paste into `src/data/exercises.ts`)

```ts
ex(
  "Lat Pulldown",
  "Shoulder Health",
  "Beginner",
  "🏋️",
  "Builds lat and pulling strength with adjustable assistance -- a scalable stepping stone toward bodyweight pull-ups.",
  ["Pull the bar to your upper chest.", "Drive elbows down and back.", "Keep torso still, don't lean back to cheat.", "Control the return."],
  ["Using body English/momentum.", "Pulling behind the neck.", "Only using arms, not lats."],
  ["Pull-Ups", "Band-Assisted Pull-Up", "Bodyweight Rows"]
),
ex(
  "RDL",
  "Jump Development",
  "Intermediate",
  "🏋️",
  "Builds hip-hinge strength and hamstring loading for jumping and sprinting power, with less axial load than a full deadlift.",
  ["Push hips back first.", "Keep the weight close to your legs.", "Soft knee bend -- this is a hinge, not a squat.", "Stop when you feel a hamstring stretch, before your back rounds."],
  ["Squatting the weight down instead of hinging.", "Rounding the lower back.", "Locking the knees straight."],
  ["Trap Bar Deadlift or RDL", "Hamstring Curls", "Nordic Hamstring Curl"]
),
ex(
  "Cable Row",
  "Shoulder Health",
  "Beginner",
  "🚣",
  "Builds mid-back and rear-shoulder pulling strength with continuous tension to balance out overhead hitting volume.",
  ["Chest tall -- don't lean back to pull.", "Pull the handle to your lower ribs.", "Squeeze shoulder blades together.", "Control the return, don't let the weight yank you forward."],
  ["Using the low back to heave the weight.", "Shrugging instead of pulling with the back.", "Partial range of motion."],
  ["Single-Arm Row", "Bodyweight Rows", "Lat Pulldown"]
),
ex(
  "Hollow Hold",
  "Rotational Core",
  "Beginner",
  "🛶",
  "Builds anti-extension core strength and full-body tension -- the base position underneath planks, L-sits, and handstands.",
  ["Press your low back into the floor.", "Arms and legs long, ribs down.", "Squeeze glutes slightly.", "Breathe without losing the low-back position."],
  ["Lower back arching off the floor.", "Holding your breath instead of breathing through it.", "Letting the legs drop too low too soon."],
  ["Dead Bugs", "Planks", "Ab Wheel Rollout"]
),
ex(
  "Swiss Ball Curl",
  "Jump Development",
  "Beginner",
  "🧵",
  "Builds hamstring strength and hip-hamstring coordination using just a stability ball -- a bodyweight, equipment-light option.",
  ["Bridge your hips up first.", "Curl heels toward glutes by pulling with the hamstrings.", "Keep hips up the whole time.", "Roll back out under control."],
  ["Hips sagging or dropping mid-set.", "Curling too fast and losing control of the ball.", "Doing partial-range curls."],
  ["Hamstring Curls", "Nordic Hamstring Curl", "RDL"]
),
ex(
  "Bird Dog",
  "Rotational Core",
  "Beginner",
  "🐕",
  "Builds core and lower-back stability by training the trunk to resist rotation while opposite arm and leg move independently.",
  ["Keep your back flat -- no sagging or arching.", "Move the opposite arm and leg together, slowly.", "Reach long instead of lifting high.", "Keep hips square to the floor."],
  ["Rotating the hips as the leg lifts.", "Rushing through reps.", "Arching the lower back to fake more range."],
  ["Dead Bugs", "Planks", "Pallof Press"]
),
ex(
  "Romanian Deadlift",
  "Jump Development",
  "Intermediate",
  "🏋️",
  "Builds hip-hinge strength and hamstring/glute loading for jumping and sprinting power.",
  ["Bar stays close to your shins and thighs.", "Push hips back with a soft knee bend.", "Keep a neutral spine throughout.", "Stop the descent once hamstrings feel loaded, before the back rounds."],
  ["Rounding the lower back.", "Letting the bar drift away from the body.", "Turning it into a squat."],
  ["RDL", "Trap Bar Deadlift or RDL", "Hip Thrust"]
),
ex(
  "Glute Bridge",
  "Jump Development",
  "Beginner",
  "🍑",
  "Builds basic glute activation and the hip-extension pattern -- the entry point before loading a full hip thrust.",
  ["Feet hip-width, heels close to glutes.", "Drive through your heels.", "Squeeze glutes hard at the top.", "Lower with control instead of dropping."],
  ["Overarching the lower back at the top.", "Pushing through the toes instead of the heels.", "Rushing reps instead of pausing at the top."],
  ["Hip Thrust", "Single-Leg Hip Thrust", "Cable Pull-Through"]
)
```

All 8 substitution cross-references point at exercises confirmed present in
the existing catalog. Categories assigned from the new 10-bucket taxonomy
(section D of the design doc) directly — "Rotational Core" used as the
general-core catch-all for Hollow Hold/Bird Dog, consistent with how existing
exercises like Dead Bugs/Planks are already being classified there.
