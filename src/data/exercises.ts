import { Exercise } from "@/types";

const yt = (query: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

const ex = (
  name: string,
  category: Exercise["category"],
  level: Exercise["level"],
  icon: string,
  purpose: string,
  cues: string[],
  mistakes: string[],
  substitutions: string[]
): Exercise => ({
  name,
  category,
  level,
  icon,
  purpose,
  cues,
  mistakes,
  substitutions,
  video: yt(`${name} proper form athlete`)
});

export const exercises: Exercise[] = [
  // JUMP DEVELOPMENT
  ex(
    "Trap Bar Deadlift or RDL",
    "Jump Development",
    "Intermediate",
    "🏋️",
    "Builds posterior-chain strength for jumping, landing, and hitting power.",
    ["Brace before lifting.", "Push the floor away.", "Keep your back neutral.", "Control the lowering."],
    ["Rounding your back.", "Jerking the weight.", "Letting knees cave inward."],
    ["Romanian Deadlift", "Kettlebell Deadlift", "Hip Thrust"]
  ),
  ex(
    "Bulgarian Split Squat",
    "Jump Development",
    "Intermediate",
    "🦵",
    "Builds single-leg strength for jumping, cutting, and knee control.",
    ["Control the descent.", "Drive through the front foot.", "Keep knee tracking over toes.", "Stay tall."],
    ["Pushing too much off the back leg.", "Letting knee cave.", "Bouncing reps."],
    ["Reverse Lunges", "Step-Ups", "Split Squat"]
  ),
  ex(
    "Hip Thrust",
    "Jump Development",
    "Beginner",
    "🍑",
    "Builds glute strength for jumping, sprinting, and hip extension power.",
    ["Ribs down.", "Drive through heels.", "Squeeze glutes at the top.", "Keep chin tucked."],
    ["Overarching lower back.", "Feet too far away.", "Rushing the top."],
    ["Glute Bridge", "Single-Leg Hip Thrust", "Cable Pull-Through"]
  ),
  ex(
    "Heel-Elevated Goblet Squat",
    "Jump Development",
    "Beginner",
    "🏆",
    "Builds quad strength and knee-friendly squat control.",
    ["Keep torso tall.", "Let knees travel forward.", "Control depth.", "Drive through midfoot."],
    ["Collapsing knees.", "Rushing reps.", "Losing heel pressure."],
    ["Goblet Squat", "Front Squat", "Spanish Squat"]
  ),
  ex(
    "Front Squat",
    "Jump Development",
    "Advanced",
    "🏋️",
    "Builds quad, core, and full-body strength for jumping.",
    ["Elbows high.", "Brace hard.", "Stay upright.", "Drive out of the bottom."],
    ["Dropping elbows.", "Folding forward.", "Going too heavy too soon."],
    ["Goblet Squat", "Heel-Elevated Goblet Squat", "Bulgarian Split Squat"]
  ),
  ex(
    "Step-Ups",
    "Jump Development",
    "Beginner",
    "🪜",
    "Builds single-leg drive and control for jumping and court movement.",
    ["Drive through the working leg.", "Control the lowering.", "Keep knee stable.", "Stand tall at top."],
    ["Pushing off the back foot.", "Dropping down fast.", "Knee collapsing inward."],
    ["Reverse Lunges", "Bulgarian Split Squat", "Split Squat"]
  ),
  ex(
    "Reverse Lunges",
    "Jump Development",
    "Beginner",
    "↩️",
    "Builds single-leg strength with less knee stress than forward lunges.",
    ["Step back under control.", "Keep front foot planted.", "Drive up strong.", "Stay balanced."],
    ["Pushing off the back leg too much.", "Leaning forward.", "Slamming the knee down."],
    ["Split Squat", "Step-Ups", "Bulgarian Split Squat"]
  ),
  ex(
    "Hamstring Curls",
    "Jump Development",
    "Beginner",
    "🧵",
    "Strengthens hamstrings for sprinting, jumping, and knee protection.",
    ["Curl smoothly.", "Pause at the top.", "Control the lowering.", "Keep hips stable."],
    ["Rushing reps.", "Using momentum.", "Arching lower back."],
    ["Nordic Hamstring Curl", "Swiss Ball Curl", "RDL"]
  ),
  ex(
    "Nordic Hamstring Curl",
    "Jump Development",
    "Advanced",
    "🧊",
    "Builds elite hamstring strength and injury resistance.",
    ["Lower slowly.", "Keep hips extended.", "Use hands to catch.", "Start with partial range."],
    ["Dropping too fast.", "Breaking at the hips.", "Doing too much volume."],
    ["Hamstring Curls", "RDL", "Swiss Ball Curl"]
  ),
  ex(
    "Calf Raises",
    "Jump Development",
    "Beginner",
    "🦶",
    "Builds ankle strength and lower-leg durability for jumping.",
    ["Use full range.", "Pause at top.", "Control down.", "Keep ankles straight."],
    ["Bouncing reps.", "Rolling ankles.", "Cutting range short."],
    ["Single-Leg Calf Raise", "Seated Calf Raise", "Pogo Hops"]
  ),
  ex(
    "Soleus Raises",
    "Jump Development",
    "Beginner",
    "🦶",
    "Builds bent-knee calf strength for landing, acceleration, and knee support.",
    ["Keep knee bent.", "Raise heel high.", "Control down.", "Use slow reps."],
    ["Straightening the knee.", "Bouncing.", "Going too heavy too soon."],
    ["Seated Calf Raise", "Single-Leg Calf Raise", "Calf Raises"]
  ),

  // JUMP DEVELOPMENT / LANDING MECHANICS / SPEED & AGILITY / VOLLEYBALL CONDITIONING
  ex(
    "Approach Jumps",
    "Jump Development",
    "Advanced",
    "🏐",
    "Transfers strength into volleyball-specific jumping.",
    ["Fast last two steps.", "Swing arms hard.", "Jump tall.", "Land softly."],
    ["Doing too many tired reps.", "Slow approach.", "Stiff landings."],
    ["Standing Vertical Jumps", "Box Jumps", "Broad Jumps"]
  ),
  ex(
    "Box Jumps",
    "Jump Development",
    "Intermediate",
    "📦",
    "Builds explosive jumping power with lower landing stress.",
    ["Jump explosively.", "Land quietly.", "Step down.", "Keep reps crisp."],
    ["Using a box too high.", "Landing in a deep squat.", "Doing conditioning reps."],
    ["Squat Jumps", "Approach Jumps", "Broad Jumps"]
  ),
  ex(
    "Broad Jumps",
    "Jump Development",
    "Intermediate",
    "🚀",
    "Builds horizontal power for approach speed and explosiveness.",
    ["Load hips back.", "Swing arms hard.", "Jump forward.", "Stick landing."],
    ["Landing stiff.", "Knees caving.", "Rushing reps."],
    ["Squat Jumps", "Bounds", "Box Jumps"]
  ),
  ex(
    "Lateral Bounds",
    "Speed & Agility",
    "Intermediate",
    "↔️",
    "Builds side-to-side power for defense and court movement.",
    ["Push off hard.", "Stick the landing.", "Keep hips level.", "Control the knee."],
    ["Rushing.", "Landing sloppy.", "Knee collapsing."],
    ["Skater Jumps", "Lateral Lunges", "Line Hops"]
  ),
  ex(
    "Landing Mechanics Drill",
    "Landing Mechanics",
    "Beginner",
    "🎯",
    "Teaches the soft-knee, hips-back, quiet landing pattern that every jump and plyo exercise depends on. Do this before adding jump volume, not after.",
    ["Step off a low box or hop lightly in place.", "Land with hips back and knees soft.", "Land as quietly as possible.", "Freeze for 2 seconds on landing to prove control."],
    ["Landing stiff-legged.", "Knees caving inward on contact.", "Landing loud: that's a sign of too much force hitting the joints."],
    ["Depth Drops", "Box Step-Offs", "Drop Squat"]
  ),
  ex(
    "Pogo Hops",
    "Jump Development",
    "Beginner",
    "🦘",
    "Builds ankle stiffness and reactive bounce.",
    ["Stay tall.", "Bounce off the balls of feet.", "Keep knees soft.", "Be quick off the floor."],
    ["Landing heavy.", "Bending knees too much.", "Doing too many tired reps."],
    ["Jump Rope", "Calf Raises", "Line Hops"]
  ),
  ex(
    "Depth Drops",
    "Landing Mechanics",
    "Intermediate",
    "⬇️",
    "Builds landing mechanics and tendon tolerance.",
    ["Step off, do not jump.", "Land quietly.", "Knees track over toes.", "Stick the landing."],
    ["Landing stiff.", "Knees caving.", "Using too high of a box."],
    ["Snap Downs", "Box Step-Offs", "Drop Squat"]
  ),
  ex(
    "Drop Jumps",
    "Jump Development",
    "Advanced",
    "⚡",
    "Builds reactive jumping ability and fast ground contact.",
    ["Land and rebound quickly.", "Stay stiff but controlled.", "Use arms.", "Keep reps low quality high."],
    ["Ground contact too long.", "Landing loud.", "Doing them fatigued."],
    ["Pogo Hops", "Depth Drops", "Box Jumps"]
  ),
  ex(
    "Sprint Starts",
    "Speed & Agility",
    "Intermediate",
    "💨",
    "Builds acceleration for approaches and defensive reactions.",
    ["Lean forward.", "Push the ground back.", "Explode first 3 steps.", "Stay low early."],
    ["Standing up too soon.", "Weak first step.", "Running tired reps."],
    ["Falling Starts", "Court Sprints", "Shuttle Runs"]
  ),
  ex(
    "Court Sprints",
    "Volleyball Conditioning",
    "Beginner",
    "🏃",
    "Builds volleyball-specific conditioning and acceleration.",
    ["Stay low.", "Push hard.", "Stop under control.", "Keep reps sharp."],
    ["Jogging.", "Sloppy stops.", "Too much volume."],
    ["Shuttle Runs", "Sprint Starts", "Lateral Bounds"]
  ),
  ex(
    "Jump Rope",
    "Jump Development",
    "Beginner",
    "🪢",
    "Builds ankle rhythm, foot speed, and conditioning.",
    ["Stay light.", "Small bounces.", "Keep wrists relaxed.", "Land quietly."],
    ["Jumping too high.", "Landing heavy.", "Using shoulders too much."],
    ["Pogo Hops", "Line Hops", "Easy Bike"]
  ),

  // SHOULDER HEALTH / HITTING POWER
  ex(
    "Pull-Ups",
    "Shoulder Health",
    "Intermediate",
    "💪",
    "Builds back strength for hitting power, shoulder health, and calisthenics.",
    ["Start from dead hang.", "Pull chest toward bar.", "Drive elbows down.", "Control down."],
    ["Half reps.", "Kipping every rep.", "Shrugging shoulders."],
    ["Band-Assisted Pull-Up", "Lat Pulldown", "Bodyweight Rows"]
  ),
  ex(
    "Band-Assisted Pull-Up",
    "Shoulder Health",
    "Beginner",
    "🎗️",
    "Builds toward a full pull-up by removing just enough bodyweight to keep every rep clean.",
    ["Loop a band around the bar and under a foot or knee.", "Full dead hang at the bottom.", "Pull chest toward the bar.", "Use the lightest band that still lets you finish the set with good form."],
    ["Using a band so strong it does all the work.", "Half reps.", "Kipping instead of pulling."],
    ["Pull-Ups", "Lat Pulldown", "Bodyweight Rows"]
  ),
  ex(
    "Chin-Ups",
    "Shoulder Health",
    "Intermediate",
    "💪",
    "Builds lats, biceps, and pulling strength.",
    ["Use full range.", "Pull elbows down.", "Keep ribs controlled.", "Lower slowly."],
    ["Half reps.", "Swinging.", "Neck reaching for bar."],
    ["Pull-Ups", "Lat Pulldown", "Band-Assisted Pull-Up"]
  ),
  ex(
    "DB Bench Press",
    "Hitting Power",
    "Beginner",
    "🏋️",
    "Builds pressing strength with shoulder-friendly movement.",
    ["Shoulder blades back.", "Lower controlled.", "Press strong.", "Keep wrists stacked."],
    ["Flaring elbows.", "Bouncing.", "Shoulders rolling forward."],
    ["Push-Ups", "Incline Push-Up", "Floor Press"]
  ),
  ex(
    "Push-Ups",
    "Hitting Power",
    "Beginner",
    "⬆️",
    "Builds chest, triceps, shoulder control, and core stiffness.",
    ["Body straight.", "Elbows controlled.", "Chest lowers first.", "Push floor away."],
    ["Sagging hips.", "Flaring elbows.", "Half reps."],
    ["Incline Push-Up", "DB Bench Press", "Dips"]
  ),
  ex(
    "Incline Push-Up",
    "Hitting Power",
    "Beginner",
    "📐",
    "The entry point into pressing strength: hands elevated on a bench or box reduce the load until a full push-up is ready.",
    ["Hands on a sturdy elevated surface.", "Body straight from head to heel.", "Chest lowers first.", "Lower the surface height as you get stronger."],
    ["Sagging hips.", "Surface too low too soon.", "Flaring elbows."],
    ["Push-Ups", "DB Bench Press", "Bench Dips"]
  ),
  ex(
    "Dips",
    "Hitting Power",
    "Intermediate",
    "🔻",
    "Builds chest, triceps, and calisthenics pressing strength.",
    ["Shoulders down.", "Control depth.", "Press strong.", "Use pain-free range."],
    ["Going too deep.", "Shrugging.", "Bouncing reps."],
    ["Push-Ups", "Bench Dips", "Incline Push-Up"]
  ),
  ex(
    "Single-Arm Row",
    "Shoulder Health",
    "Beginner",
    "🛶",
    "Builds back strength and shoulder balance.",
    ["Pull elbow to hip.", "Keep torso still.", "Squeeze back.", "Control down."],
    ["Twisting body.", "Shrugging.", "Yanking weight."],
    ["Chest-Supported Row", "Cable Row", "Bodyweight Rows"]
  ),
  ex(
    "Bodyweight Rows",
    "Shoulder Health",
    "Beginner",
    "🛶",
    "Builds pulling endurance and shoulder balance.",
    ["Body straight.", "Pull chest to bar.", "Squeeze shoulder blades.", "Control down."],
    ["Sagging hips.", "Half reps.", "Shrugging."],
    ["Chest-Supported Row", "Single-Arm Row", "Cable Row"]
  ),
  ex(
    "Landmine Press or DB Shoulder Press",
    "Hitting Power",
    "Beginner",
    "💥",
    "Builds shoulder pressing power for hitting.",
    ["Brace core.", "Press up strong.", "Keep ribs down.", "Control lowering."],
    ["Arching lower back.", "Shrugging.", "Pressing through pain."],
    ["Half-Kneeling Landmine Press", "Pike Push-Ups", "Push Press"]
  ),
  ex(
    "Push Press",
    "Hitting Power",
    "Advanced",
    "🚀",
    "Builds explosive pressing power and full-body force transfer.",
    ["Dip straight down.", "Drive with legs.", "Punch overhead.", "Brace hard."],
    ["Turning it into strict press.", "Arching lower back.", "Pressing through pain."],
    ["Half-Kneeling Landmine Press", "Landmine Press or DB Shoulder Press", "Med Ball Chest Pass"]
  ),
  ex(
    "Pike Push-Ups",
    "Hitting Power",
    "Intermediate",
    "🔺",
    "Builds shoulder strength for calisthenics and overhead power.",
    ["Hips high.", "Head moves forward.", "Elbows controlled.", "Press through shoulders."],
    ["Turning into regular push-up.", "Flaring elbows.", "Rushing."],
    ["Landmine Press or DB Shoulder Press", "Handstand Practice", "Push-Ups"]
  ),
  ex(
    "Handstand Practice",
    "Shoulder Health",
    "Advanced",
    "🤸",
    "Builds shoulder stability, body control, and calisthenics skill.",
    ["Push tall.", "Squeeze glutes.", "Ribs tucked.", "Use fingers for balance."],
    ["Banana back.", "Soft shoulders.", "Kicking up with no control."],
    ["Pike Push-Ups", "Scap Push-Ups", "Bear Crawl"]
  ),

  // ROTATIONAL CORE
  ex(
    "Pallof Press",
    "Rotational Core",
    "Beginner",
    "🧱",
    "Builds anti-rotation core strength for hitting stability.",
    ["Brace hard.", "Press straight out.", "Do not rotate.", "Move slow."],
    ["Twisting with band.", "Shrugging.", "Too much weight."],
    ["Dead Bugs", "Side Planks", "Suitcase Carry"]
  ),
  ex(
    "Med Ball Rotational Throws",
    "Rotational Core",
    "Intermediate",
    "🔁",
    "Builds rotational power for harder hitting.",
    ["Rotate hips first.", "Throw explosively.", "Brace core.", "Reset each rep."],
    ["Only using arms.", "Rushing reps.", "Knees caving."],
    ["Cable Woodchoppers", "Landmine Rotations", "Band Rotations"]
  ),
  ex(
    "Cable Woodchoppers",
    "Rotational Core",
    "Intermediate",
    "🪓",
    "Builds rotational strength and control for hitting.",
    ["Rotate through hips and ribs.", "Keep arms long.", "Control back.", "Brace core."],
    ["Only pulling with arms.", "Using too much weight.", "Twisting knees awkwardly."],
    ["Band Rotations", "Med Ball Rotational Throws", "Landmine Rotations"]
  ),
  ex(
    "Landmine Rotations",
    "Rotational Core",
    "Intermediate",
    "🔄",
    "Builds rotational trunk strength and power transfer.",
    ["Rotate hips.", "Keep arms strong.", "Brace at finish.", "Move explosively but controlled."],
    ["Only using arms.", "Over-rotating low back.", "Going too heavy."],
    ["Cable Woodchoppers", "Med Ball Rotational Throws", "Band Rotations"]
  ),
  ex(
    "Hanging Leg Raises",
    "Rotational Core",
    "Advanced",
    "🧱",
    "Builds core strength, hip flexor strength, and control.",
    ["Control swing.", "Tuck pelvis.", "Raise with abs.", "Lower slowly."],
    ["Swinging wildly.", "Using momentum.", "Arching lower back."],
    ["Hanging Knee Raises", "Hollow Hold", "Dead Bugs"]
  ),
  ex(
    "L-Sit Practice",
    "Rotational Core",
    "Advanced",
    "🧘",
    "Builds core compression, hip flexors, and calisthenics control.",
    ["Push shoulders down.", "Lock elbows.", "Point toes.", "Keep chest tall."],
    ["Bent arms.", "Collapsed shoulders.", "Holding breath."],
    ["Hollow Hold", "Dead Bugs", "Hanging Knee Raises"]
  ),
  ex(
    "Dead Bugs",
    "Rotational Core",
    "Beginner",
    "🐞",
    "Builds core control and lower-back stability.",
    ["Low back gently into floor.", "Move opposite arm and leg.", "Exhale as you extend.", "Go slow."],
    ["Arching lower back.", "Moving too fast.", "Holding breath."],
    ["Bird Dog", "Pallof Press", "Hollow Hold"]
  ),
  ex(
    "Side Planks",
    "Rotational Core",
    "Beginner",
    "📏",
    "Builds lateral core strength for hitting and landing control.",
    ["Stack shoulders and hips.", "Push floor away.", "Squeeze glutes.", "Stay long."],
    ["Sagging hips.", "Rotating forward.", "Holding breath."],
    ["Pallof Press", "Copenhagen Plank", "Suitcase Carry"]
  ),
  ex(
    "Planks",
    "Rotational Core",
    "Beginner",
    "🪵",
    "Builds basic trunk stiffness and core endurance.",
    ["Ribs down.", "Squeeze glutes.", "Push floor away.", "Breathe slowly."],
    ["Sagging hips.", "Butt too high.", "Holding breath."],
    ["Dead Bugs", "Hollow Hold", "Stability Ball Rollout"]
  ),
  ex(
    "Ab Wheel Rollout",
    "Rotational Core",
    "Advanced",
    "⚙️",
    "Builds strong anti-extension core strength.",
    ["Ribs down.", "Glutes tight.", "Roll only as far as you control.", "Pull back with abs."],
    ["Arching lower back.", "Going too far.", "Rushing."],
    ["Stability Ball Rollout", "Dead Bugs", "Planks"]
  ),
  ex(
    "Back Extensions",
    "Rotational Core",
    "Beginner",
    "🛡️",
    "Strengthens lower back, glutes, and hamstrings.",
    ["Move through hips.", "Squeeze glutes.", "Neutral spine.", "Control reps."],
    ["Overextending back.", "Swinging.", "Going too fast."],
    ["Bird Dog", "RDL", "Hip Thrust"]
  ),
  ex(
    "Farmer Carries",
    "Rotational Core",
    "Beginner",
    "🧳",
    "Builds grip, traps, core stiffness, and durability.",
    ["Stand tall.", "Brace core.", "Walk controlled.", "Do not lean."],
    ["Letting weights swing.", "Shrugging hard.", "Walking sloppy."],
    ["Suitcase Carry", "Side Planks", "Planks"]
  ),

  // KNEE STRENGTH / SHOULDER HEALTH
  ex(
    "Lateral Band Walks",
    "Knee Strength",
    "Beginner",
    "🎗️",
    "Trains the hip abductors and glute medius to help control knee position on landing, a commonly used piece of knee-injury-risk-reduction work, though the strength-to-valgus link isn't as clear-cut as often claimed.",
    ["Band above the knees or around the ankles.", "Slight knee bend throughout.", "Step sideways under tension, don't let the band go slack.", "Keep toes forward, hips level."],
    ["Standing too upright.", "Letting the band go slack between steps.", "Knees caving inward instead of pushing out against the band."],
    ["Clamshells", "Monster Walks", "Single-Leg Balance Reach"]
  ),
  ex(
    "Clamshells",
    "Knee Strength",
    "Beginner",
    "🐚",
    "Isolates the glute medius to build hip control that keeps the knee tracking properly on landing and cutting.",
    ["Lie on your side, knees bent, feet together.", "Keep hips stacked, don't roll back.", "Lift the top knee using the glute, not momentum.", "Lower with control."],
    ["Rolling the hips backward to fake more range.", "Using momentum instead of the muscle.", "Going too fast."],
    ["Lateral Band Walks", "Glute Bridge", "Monster Walks"]
  ),
  ex(
    "Spanish Squat",
    "Knee Strength",
    "Intermediate",
    "🦿",
    "Builds quad and patellar tendon tolerance for knee health.",
    ["Stay upright.", "Sit back into band.", "Keep quad tension.", "Use pain-free pressure."],
    ["Relaxing at bottom.", "Knees caving.", "Going into sharp pain."],
    ["Wall Sit", "Reverse Sled Drag", "Patrick Step"]
  ),
  ex(
    "Single-Leg Balance Reach",
    "Knee Strength",
    "Beginner",
    "🎯",
    "Builds single-leg stability and proprioception, most useful as a supporting piece of ACL-injury-risk-reduction work alongside real strength and plyometric training, not as a stand-alone fix.",
    ["Stand tall on one leg, soft knee.", "Reach the free foot forward, side, and back under control.", "Keep the standing knee tracking over the toes.", "Return to a stable center each rep."],
    ["Standing knee caving in on the reach.", "Rushing through reaches without control.", "Letting the hips drop on the standing side."],
    ["Lateral Band Walks", "Single-Leg RDL", "Patrick Step"]
  ),
  ex(
    "Tibialis Raises",
    "Knee Strength",
    "Beginner",
    "🦶",
    "Strengthens the front of the shin for knee and ankle durability.",
    ["Heels planted.", "Pull toes up hard.", "Control down.", "Use full range."],
    ["Using momentum.", "Tiny reps.", "Rocking hips."],
    ["Patrick Step", "Wall Toe Raises", "Ankle Rocks"]
  ),
  ex(
    "Patrick Step",
    "Knee Strength",
    "Intermediate",
    "🦵",
    "Builds knee control and tendon tolerance through controlled range.",
    ["Move slow.", "Let knee travel forward.", "Keep heel down if possible.", "Stay pain-free."],
    ["Dropping fast.", "Forcing pain.", "Knee caving."],
    ["Poliquin Step-Down", "Spanish Squat", "Reverse Sled Drag"]
  ),
  ex(
    "Poliquin Step-Down",
    "Knee Strength",
    "Intermediate",
    "📉",
    "Builds VMO and knee control for jumper's knee prevention.",
    ["Control the lowering.", "Tap heel lightly.", "Keep knee tracking.", "Stay upright."],
    ["Dropping too fast.", "Collapsing knee.", "Using too high of a step."],
    ["Patrick Step", "Step-Ups", "Spanish Squat"]
  ),
  ex(
    "Reverse Sled Drag",
    "Knee Strength",
    "Beginner",
    "🛷",
    "Builds quad strength and knee blood flow with low joint stress.",
    ["Stay low.", "Push through toes.", "Keep constant steps.", "Do not rush."],
    ["Standing too tall.", "Taking huge steps.", "Going too heavy."],
    ["Poliquin Step-Down", "Spanish Squat", "Wall Sit"]
  ),
  ex(
    "Face Pulls",
    "Shoulder Health",
    "Beginner",
    "🧵",
    "Builds rear delts and rotator cuff support.",
    ["Pull toward forehead.", "Elbows high.", "Squeeze shoulder blades.", "Control return."],
    ["Too much weight.", "Turning it into a row.", "Arching back."],
    ["Band Pull-Aparts", "Rear Delt Fly", "External Rotations"]
  ),
  ex(
    "Band Pull-Aparts",
    "Shoulder Health",
    "Beginner",
    "🟡",
    "Builds rear delt and upper-back endurance for shoulder health.",
    ["Arms straight.", "Pull to chest.", "Squeeze shoulder blades.", "Control in."],
    ["Shrugging.", "Bending elbows too much.", "Snapping back."],
    ["Face Pulls", "Rear Delt Fly", "Y-T-W Raises"]
  ),
  ex(
    "External Rotations",
    "Shoulder Health",
    "Beginner",
    "🔧",
    "Strengthens the rotator cuff to protect your shoulder during hitting.",
    ["Elbow tucked.", "Move slowly.", "Use light resistance.", "Stop before pain."],
    ["Too heavy.", "Elbow drifting.", "Twisting torso."],
    ["Cuban Rotations", "Light Shoulder Band Work", "Face Pulls"]
  ),
  ex(
    "Scap Push-Ups",
    "Shoulder Health",
    "Beginner",
    "🪽",
    "Builds serratus and scapular control for healthier shoulders.",
    ["Arms straight.", "Push floor away.", "Let shoulder blades move.", "Control reps."],
    ["Bending elbows.", "Rushing.", "Sagging hips."],
    ["Push-Ups", "Wall Slides", "Bear Crawl"]
  ),
  ex(
    "Y-T-W Raises",
    "Shoulder Health",
    "Beginner",
    "🪽",
    "Strengthens lower traps, rear delts, and shoulder stabilizers.",
    ["Move slow.", "Thumbs up.", "Squeeze gently.", "Use light weight."],
    ["Going too heavy.", "Shrugging.", "Rushing reps."],
    ["Rear Delt Fly", "Band Pull-Aparts", "Wall Slides"]
  ),
  ex(
    "Cuban Rotations",
    "Shoulder Health",
    "Intermediate",
    "🔄",
    "Builds rotator cuff strength and shoulder control.",
    ["Use very light weight.", "Move slow.", "Stay controlled.", "No pain."],
    ["Going heavy.", "Rushing.", "Forcing range."],
    ["External Rotations", "Face Pulls", "Y-T-W Raises"]
  ),
  ex(
    "Light Shoulder Band Work",
    "Shoulder Health",
    "Beginner",
    "🟡",
    "Keeps rotator cuff and shoulders ready for hitting.",
    ["Light tension.", "Move slow.", "No shrugging.", "Feel shoulder, not neck."],
    ["Too much resistance.", "Rushing.", "Working through pain."],
    ["Band Pull-Aparts", "External Rotations", "Face Pulls"]
  ),

  // MOBILITY / RECOVERY (unchanged block, plus 3 items reclassified into RECOVERY below)
  ex(
    "Full-Body Mobility Flow",
    "Mobility",
    "Beginner",
    "🧘",
    "Improves movement quality, recovery, and joint range.",
    ["Move slowly.", "Breathe.", "Do not force range.", "Stay relaxed."],
    ["Rushing.", "Forcing pain.", "Holding breath."],
    ["Light Stretching", "Hip CARs", "Shoulder CARs"]
  ),
  ex(
    "Deep Squat Holds",
    "Mobility",
    "Beginner",
    "🧎",
    "Improves ankle, hip, and squat mobility.",
    ["Heels down if possible.", "Breathe.", "Push knees out gently.", "Relax."],
    ["Forcing painful depth.", "Rounding hard.", "Holding tension."],
    ["Goblet Squat", "Wall Sit", "Ankle Rocks"]
  ),
  ex(
    "Couch Stretch",
    "Mobility",
    "Beginner",
    "🛋️",
    "Opens hip flexors and quads for better jumping posture.",
    ["Squeeze back-leg glute.", "Ribs down.", "Breathe slowly.", "Avoid low-back arch."],
    ["Overarching.", "Forcing knee pain.", "Holding breath."],
    ["Half-Kneeling Hip Flexor Stretch", "Light Stretching", "Hip CARs"]
  ),
  ex(
    "Shoulder CARs",
    "Mobility",
    "Beginner",
    "🔄",
    "Improves shoulder control and range.",
    ["Move slowly.", "Ribs down.", "Pain-free range.", "Control every angle."],
    ["Rushing.", "Arching back.", "Forcing pinching pain."],
    ["Light Shoulder Band Work", "Wall Slides", "Thoracic Rotations"]
  ),
  ex(
    "Hip CARs",
    "Mobility",
    "Beginner",
    "🔄",
    "Improves hip control, range, and movement quality.",
    ["Move slow.", "Torso still.", "Pain-free range.", "Control the circle."],
    ["Twisting torso.", "Rushing.", "Forcing pinchy range."],
    ["90/90 Hip Switches", "Half-Kneeling Hip Flexor Stretch", "Deep Squat Holds"]
  ),
  ex(
    "90/90 Hip Switches",
    "Mobility",
    "Intermediate",
    "🦴",
    "Improves hip rotation for smoother movement and lower-body mechanics.",
    ["Sit tall.", "Rotate slowly.", "Use hands if needed.", "Stay controlled."],
    ["Rushing.", "Forcing knees down.", "Slumping hard."],
    ["Hip CARs", "Half-Kneeling Hip Flexor Stretch", "Deep Squat Holds"]
  ),
  ex(
    "Ankle Rocks",
    "Mobility",
    "Beginner",
    "🦶",
    "Improves ankle dorsiflexion for squats, landings, and knee tracking.",
    ["Keep heel down.", "Drive knee forward.", "Move slow.", "Use pain-free range."],
    ["Heel lifting.", "Bouncing hard.", "Forcing pain."],
    ["Wall Toe Raises", "Deep Squat Holds", "Light Stretching"]
  ),
  ex(
    "Thoracic Rotations",
    "Mobility",
    "Beginner",
    "🌀",
    "Improves upper-back rotation for hitting mechanics.",
    ["Rotate through upper back.", "Breathe out.", "Move slow.", "Keep hips stable."],
    ["Twisting low back.", "Rushing.", "Holding breath."],
    ["Open Books", "Full-Body Mobility Flow", "Shoulder CARs"]
  ),
  ex(
    "Walk 20-30 minutes",
    "Recovery",
    "Beginner",
    "🚶",
    "Improves recovery and blood flow without beating up your joints.",
    ["Easy pace.", "Relax shoulders.", "Breathe steadily.", "Keep it easy."],
    ["Turning it into conditioning.", "Skipping it because it feels too easy.", "Bad posture."],
    ["Easy Bike", "Light Stretching", "Foam Roll"]
  ),
  ex(
    "Light Stretching",
    "Recovery",
    "Beginner",
    "🧘",
    "Helps recovery and keeps joints moving on rest days.",
    ["Stay gentle.", "Breathe slowly.", "Avoid sharp pain.", "Relax into positions."],
    ["Forcing range.", "Stretching aggressively sore muscles.", "Holding breath."],
    ["Full-Body Mobility Flow", "Walk 20-30 minutes", "Foam Roll"]
  ),
  ex(
    "Foam Roll",
    "Recovery",
    "Beginner",
    "🛞",
    "Helps reduce tightness and improve recovery before or after training.",
    ["Roll slowly.", "Pause on tight spots.", "Breathe.", "Keep pressure tolerable."],
    ["Rolling too fast.", "Crushing painful spots.", "Expecting it to replace strength work."],
    ["Light Stretching", "Easy Bike", "Full-Body Mobility Flow"]
  ),

  // NEW CATALOG ENTRIES (Task 15)
  ex(
    "Lat Pulldown",
    "Shoulder Health",
    "Beginner",
    "🏋️",
    "Builds lat and pulling strength with adjustable assistance, a scalable stepping stone toward bodyweight pull-ups.",
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
    ["Push hips back first.", "Keep the weight close to your legs.", "Soft knee bend: this is a hinge, not a squat.", "Stop when you feel a hamstring stretch, before your back rounds."],
    ["Squatting the weight down instead of hinging.", "Rounding the lower back.", "Locking the knees straight."],
    ["Trap Bar Deadlift or RDL", "Hamstring Curls", "Nordic Hamstring Curl"]
  ),
  ex(
    "Cable Row",
    "Shoulder Health",
    "Beginner",
    "🚣",
    "Builds mid-back and rear-shoulder pulling strength with continuous tension to balance out overhead hitting volume.",
    ["Chest tall: don't lean back to pull.", "Pull the handle to your lower ribs.", "Squeeze shoulder blades together.", "Control the return, don't let the weight yank you forward."],
    ["Using the low back to heave the weight.", "Shrugging instead of pulling with the back.", "Partial range of motion."],
    ["Single-Arm Row", "Bodyweight Rows", "Lat Pulldown"]
  ),
  ex(
    "Hollow Hold",
    "Rotational Core",
    "Beginner",
    "🛶",
    "Builds anti-extension core strength and full-body tension, the base position underneath planks, L-sits, and handstands.",
    ["Press your low back into the floor.", "Arms and legs long, ribs down.", "Squeeze glutes slightly.", "Breathe without losing the low-back position."],
    ["Lower back arching off the floor.", "Holding your breath instead of breathing through it.", "Letting the legs drop too low too soon."],
    ["Dead Bugs", "Planks", "Ab Wheel Rollout"]
  ),
  ex(
    "Swiss Ball Curl",
    "Jump Development",
    "Beginner",
    "🧵",
    "Builds hamstring strength and hip-hamstring coordination using just a stability ball, a bodyweight, equipment-light option.",
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
    ["Keep your back flat: no sagging or arching.", "Move the opposite arm and leg together, slowly.", "Reach long instead of lifting high.", "Keep hips square to the floor."],
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
    "Builds basic glute activation and the hip-extension pattern, the entry point before loading a full hip thrust.",
    ["Feet hip-width, heels close to glutes.", "Drive through your heels.", "Squeeze glutes hard at the top.", "Lower with control instead of dropping."],
    ["Overarching the lower back at the top.", "Pushing through the toes instead of the heels.", "Rushing reps instead of pausing at the top."],
    ["Hip Thrust", "Single-Leg Hip Thrust", "Cable Pull-Through"]
  ),

  ex(
    "Split Squat",
    "Jump Development",
    "Beginner",
    "🦿",
    "Builds single-leg strength and balance from a stationary stance, the base progression before adding a Bulgarian split squat's elevated rear foot.",
    ["Feet split front-to-back, torso tall.", "Lower straight down, not forward.", "Front knee tracks over the toes.", "Push evenly through the whole front foot."],
    ["Leaning too far forward.", "Letting the front knee cave inward.", "Taking a stance too narrow to balance."],
    ["Bulgarian Split Squat", "Reverse Lunges", "Step-Ups"]
  ),
  ex(
    "Single-Leg Hip Thrust",
    "Jump Development",
    "Intermediate",
    "🍑",
    "Builds single-leg glute strength and hip stability beyond what the two-leg hip thrust demands.",
    ["Shoulders on a bench, one foot planted.", "Free leg stays relaxed, not driving the rep.", "Drive through the planted heel.", "Squeeze the glute hard at the top."],
    ["Rotating the hips to help the working side.", "Overarching the lower back at the top.", "Rushing through reps."],
    ["Hip Thrust", "Glute Bridge", "Cable Pull-Through"]
  ),
  ex(
    "Cable Pull-Through",
    "Jump Development",
    "Beginner",
    "🏋️",
    "Builds hip-hinge strength and glute drive with constant cable tension and less spinal load than a barbell hinge.",
    ["Hinge at the hips, not the knees.", "Keep the cable close to your body.", "Drive hips forward to finish.", "Squeeze glutes at the top."],
    ["Squatting the weight instead of hinging.", "Rounding the lower back.", "Using the arms to pull."],
    ["Hip Thrust", "RDL", "Single-Leg Hip Thrust"]
  ),
  ex(
    "Goblet Squat",
    "Jump Development",
    "Beginner",
    "🏆",
    "Builds quad and core strength with a front-loaded hold that keeps the torso upright through the squat.",
    ["Hold the weight close to your chest.", "Elbows brush inside the knees at the bottom.", "Keep your torso tall.", "Drive through the whole foot to stand."],
    ["Letting the chest fall forward.", "Knees caving inward.", "Cutting depth short."],
    ["Heel-Elevated Goblet Squat", "Front Squat", "Split Squat"]
  ),
  ex(
    "Seated Calf Raise",
    "Jump Development",
    "Beginner",
    "🦶",
    "Isolates the soleus with the knee bent, a key lower-leg muscle for jumping and landing that standing calf work doesn't fully reach.",
    ["Knees bent at roughly 90 degrees.", "Raise the heels as high as possible.", "Pause at the top.", "Lower under control for a full stretch."],
    ["Bouncing through the bottom.", "Using a tiny range of motion.", "Rushing the tempo."],
    ["Calf Raises", "Soleus Raises", "Single-Leg Calf Raise"]
  ),
  ex(
    "Box Step-Offs",
    "Landing Mechanics",
    "Beginner",
    "⬇️",
    "Teaches a soft, controlled landing by stepping off a low box instead of jumping, the entry point before adding depth drops or jump volume.",
    ["Step off, don't jump off.", "Land on both feet, hips back, knees soft.", "Land as quietly as possible.", "Stick the landing for a full second before resetting."],
    ["Landing stiff-legged.", "Knees caving in on contact.", "Using too high of a box too soon."],
    ["Landing Mechanics Drill", "Depth Drops", "Drop Squat"]
  ),
  ex(
    "Drop Squat",
    "Landing Mechanics",
    "Beginner",
    "🎯",
    "Trains the body to absorb force fast by dropping quickly into a stable squat position. Builds the landing reflex jumping and cutting rely on.",
    ["Start standing tall.", "Drop quickly into a quarter-to-half squat.", "Land quiet with hips back and knees soft.", "Freeze in the landing position for two seconds."],
    ["Landing with straight legs.", "Knees collapsing inward.", "Wobbling instead of sticking the landing."],
    ["Landing Mechanics Drill", "Box Step-Offs", "Depth Drops"]
  ),
  ex(
    "Line Hops",
    "Jump Development",
    "Beginner",
    "🦘",
    "Builds ankle stiffness, rhythm, and reactive bounce using nothing but a line on the floor.",
    ["Stay light on the balls of your feet.", "Hop side to side over the line.", "Keep ground contact time short.", "Keep knees soft, not locked."],
    ["Jumping too high instead of quick.", "Landing heavy.", "Losing rhythm between hops."],
    ["Pogo Hops", "Jump Rope", "Lateral Bounds"]
  ),
  ex(
    "Easy Bike",
    "Recovery",
    "Beginner",
    "🚴",
    "Low-impact cardio that raises blood flow for recovery without adding joint stress on rest or light days.",
    ["Keep the resistance light.", "Hold an easy, conversational pace.", "Relax your shoulders and grip.", "Stop before you feel fatigued, not after."],
    ["Turning it into a hard workout.", "Gripping the bars too tight.", "Skipping it because it feels too easy: that's the point."],
    ["Walk 20-30 minutes", "Light Stretching", "Foam Roll"]
  ),
  ex(
    "Band Rotations",
    "Rotational Core",
    "Beginner",
    "🎗️",
    "Builds rotational core strength with a resistance band, an accessible entry point before loading a cable or landmine rotation.",
    ["Anchor the band at chest height to your side.", "Rotate through the hips and ribs together.", "Keep arms long, don't just pull with the hands.", "Control the return, don't let the band snap you back."],
    ["Only rotating the arms, not the torso.", "Using too much band tension.", "Rushing the return."],
    ["Med Ball Rotational Throws", "Cable Woodchoppers", "Landmine Rotations"]
  ),
  // Added so every substitution hint resolves to a real entry (see
  // tests/data/workoutPlan.test.ts). Each one is a distinct, commonly picked
  // swap rather than a renamed duplicate of an existing exercise.
  ex(
    "Kettlebell Deadlift",
    "Jump Development",
    "Beginner",
    "🏋️",
    "Teaches the hip hinge with a light, easy-to-hold load before moving to a trap bar or barbell.",
    ["Set the bell between your feet.", "Push hips back, shins stay nearly vertical.", "Brace, then stand up by driving the floor away.", "Lower with control, same path down."],
    ["Squatting the weight instead of hinging.", "Rounding the back to reach the bell.", "Leaning back at the top."],
    ["Romanian Deadlift", "Glute Bridge", "Hip Thrust"]
  ),
  ex(
    "Single-Leg RDL",
    "Jump Development",
    "Intermediate",
    "🦩",
    "Builds hamstring strength and single-leg hip control, the same balance a one-foot takeoff and landing need.",
    ["Soft knee on the standing leg.", "Reach the free leg straight back as the chest lowers.", "Keep hips square to the floor.", "Stand up by squeezing the standing glute."],
    ["Opening the hip toward the ceiling.", "Rounding the back to reach lower.", "Rushing the balance."],
    ["Romanian Deadlift", "Single-Leg Balance Reach", "Single-Leg Hip Thrust"]
  ),
  ex(
    "Squat Jumps",
    "Jump Development",
    "Beginner",
    "⬆️",
    "Trains vertical power from a squat with no equipment, a simple way to add jump volume anywhere.",
    ["Sit to a quarter-to-half squat.", "Swing the arms and explode up.", "Land soft, hips back, knees over toes.", "Reset fully between reps."],
    ["Landing stiff-legged.", "Knees caving on the landing.", "Chaining reps so fast they get sloppy."],
    ["Box Jumps", "Approach Jumps", "Pogo Hops"]
  ),
  ex(
    "Standing Vertical Jumps",
    "Jump Development",
    "Beginner",
    "🏐",
    "Max-effort jumps with no approach, the same jump used for blocking at the net.",
    ["Start feet hip-width, arms ready.", "Quick dip, then swing the arms up hard.", "Reach as high as you can at the top.", "Land soft and balanced, then reset."],
    ["Taking a step before jumping.", "Dipping too deep and too slow.", "Landing on the heels."],
    ["Squat Jumps", "Box Jumps", "Approach Jumps"]
  ),
  ex(
    "Bounds",
    "Speed & Agility",
    "Intermediate",
    "🦘",
    "Long, powerful strides that build horizontal power and hip extension for faster first steps and approaches.",
    ["Drive the knee up and forward.", "Push the ground back hard on each stride.", "Hang in the air, then land under the hips.", "Use the arms in rhythm with the legs."],
    ["Short, choppy strides.", "Landing far in front of the body.", "Collapsing on each contact."],
    ["Broad Jumps", "Lateral Bounds", "Sprint Starts"]
  ),
  ex(
    "Skater Jumps",
    "Speed & Agility",
    "Beginner",
    "⛸️",
    "Side-to-side single-leg jumps that build lateral power and landing control for defensive and blocking footwork.",
    ["Push off the outside foot.", "Land on the opposite foot, knee soft.", "Stick each landing for a beat at first.", "Keep the chest up and hips back."],
    ["Knee caving on the landing leg.", "Bouncing straight out without control.", "Landing on a straight leg."],
    ["Lateral Bounds", "Lateral Lunges", "Line Hops"]
  ),
  ex(
    "Lateral Lunges",
    "Knee Strength",
    "Beginner",
    "↔️",
    "Builds strength and control moving side to side, including the adductors that protect the knee on lateral cuts.",
    ["Step wide and sit back into one hip.", "Keep the other leg straight and the foot flat.", "Knee tracks over the toes.", "Push back to the start through the bent leg."],
    ["Letting the knee drift past the toes or cave in.", "Rounding the back to get lower.", "Stepping too short to load the hip."],
    ["Reverse Lunges", "Lateral Band Walks", "Split Squat"]
  ),
  ex(
    "Snap Downs",
    "Landing Mechanics",
    "Beginner",
    "⬇️",
    "Rises onto the toes, then snaps down into an athletic landing position. Teaches fast, stable force absorption with no box.",
    ["Rise tall on your toes with arms up.", "Snap the arms down and drop into a quarter squat.", "Land flat-footed, hips back, knees soft.", "Freeze the landing for two seconds."],
    ["Landing on the toes only.", "Knees collapsing in.", "Wobbling instead of sticking it."],
    ["Drop Squat", "Landing Mechanics Drill", "Box Step-Offs"]
  ),
  ex(
    "Falling Starts",
    "Speed & Agility",
    "Beginner",
    "🏃",
    "Lean forward until you have to step, then sprint. Teaches a fast first step and a good acceleration angle.",
    ["Stand tall and lean from the ankles.", "Let yourself fall until you must step.", "Drive the first step hard under the hips.", "Sprint 5-10 m, then walk back."],
    ["Bending at the waist instead of leaning tall.", "Taking a small, choppy first step.", "Standing up too early."],
    ["Sprint Starts", "Court Sprints", "Bounds"]
  ),
  ex(
    "Shuttle Runs",
    "Volleyball Conditioning",
    "Beginner",
    "🔁",
    "Short sprints with change of direction that match the stop-and-go demands of a rally.",
    ["Sprint to the line and touch it.", "Plant on the outside foot, hips low.", "Push off hard back the other way.", "Rest fully so every rep stays fast."],
    ["Rounding the turn instead of planting.", "Standing up tall on the change of direction.", "Cutting rest so reps get slow."],
    ["Court Sprints", "Sprint Starts", "Lateral Bounds"]
  ),
  ex(
    "Wall Sit",
    "Knee Strength",
    "Beginner",
    "🧱",
    "An isometric quad hold that loads the knee with no impact. Often tolerated well by sore or irritated knees.",
    ["Back flat on the wall, feet out in front.", "Slide down until knees are near 90 degrees, or higher if it hurts.", "Knees over the ankles, weight in the heels.", "Breathe and hold."],
    ["Feet too close so the knees go past the toes.", "Pushing hands on the thighs.", "Going deeper than pain allows."],
    ["Spanish Squat", "Deep Squat Holds", "Poliquin Step-Down"]
  ),
  ex(
    "Copenhagen Plank",
    "Rotational Core",
    "Intermediate",
    "🛡️",
    "A side plank with the top leg on a bench. Builds the adductors and lateral core, linked to fewer groin strains.",
    ["Top leg on the bench, inside of the knee or ankle on it.", "Lift the hips into a straight line.", "Keep the bottom leg off the floor if you can.", "Start with the knee on the bench, short holds."],
    ["Hips sagging toward the floor.", "Rolling the chest forward.", "Starting with the ankle version too soon."],
    ["Side Planks", "Lateral Lunges", "Clamshells"]
  ),
  ex(
    "Suitcase Carry",
    "Rotational Core",
    "Beginner",
    "🧳",
    "Carrying weight in one hand trains the core to resist leaning, the same lateral stability that keeps you upright in the air.",
    ["Hold one heavy weight at your side.", "Stand tall, shoulders level.", "Walk slowly with short, controlled steps.", "Switch hands every set."],
    ["Leaning toward or away from the weight.", "Shrugging the loaded shoulder.", "Rushing the steps."],
    ["Farmer Carries", "Side Planks", "Pallof Press"]
  ),
  ex(
    "Stability Ball Rollout",
    "Rotational Core",
    "Beginner",
    "⚪",
    "An easier version of the ab wheel. Trains the core to resist the lower back arching.",
    ["Kneel with forearms on the ball.", "Ribs down, glutes tight.", "Roll the ball out only as far as you can keep a flat back.", "Pull back with the core, not the hips."],
    ["Letting the lower back sag.", "Pushing the hips back to return.", "Rolling out too far too soon."],
    ["Ab Wheel Rollout", "Planks", "Dead Bugs"]
  ),
  ex(
    "Hanging Knee Raises",
    "Rotational Core",
    "Beginner",
    "🔼",
    "A lower-abs exercise from a hang. The step before straight-leg raises.",
    ["Hang with shoulders active, not shrugged.", "Curl the knees toward the chest.", "Tilt the pelvis up at the top.", "Lower slowly without swinging."],
    ["Swinging to get the knees up.", "Only lifting the knees to hip height.", "Dropping fast out of the top."],
    ["Hanging Leg Raises", "Dead Bugs", "Hollow Hold"]
  ),
  ex(
    "Bench Dips",
    "Hitting Power",
    "Beginner",
    "🪑",
    "A triceps and chest exercise using a bench. The easier step before full parallel-bar dips.",
    ["Hands on the bench edge, fingers forward.", "Keep the hips close to the bench.", "Lower until elbows are near 90 degrees.", "Press back up without shrugging."],
    ["Going so deep the shoulder hurts.", "Flaring the elbows wide.", "Letting the shoulders roll forward."],
    ["Push-Ups", "Incline Push-Up", "DB Bench Press"]
  ),
  ex(
    "Chest-Supported Row",
    "Shoulder Health",
    "Beginner",
    "🚣",
    "A row with the chest on an incline bench, so the back does the work without the lower back holding position.",
    ["Chest on the pad, feet planted.", "Pull the elbows back toward the hips.", "Squeeze the shoulder blades together at the top.", "Lower slowly to a full stretch."],
    ["Lifting the chest off the pad.", "Shrugging toward the ears.", "Using momentum."],
    ["Single-Arm Row", "Cable Row", "Bodyweight Rows"]
  ),
  ex(
    "Floor Press",
    "Hitting Power",
    "Beginner",
    "🏋️",
    "A dumbbell press lying on the floor. The floor limits the range, which is easier on the shoulders than a full bench press.",
    ["Lie with knees bent, dumbbells over the chest.", "Lower until the upper arms touch the floor.", "Elbows about 45 degrees from the body.", "Press straight up."],
    ["Bouncing the elbows off the floor.", "Flaring the elbows to 90 degrees.", "Arching the back off the floor."],
    ["DB Bench Press", "Push-Ups", "Incline Push-Up"]
  ),
  ex(
    "Med Ball Chest Pass",
    "Hitting Power",
    "Beginner",
    "🏀",
    "An explosive two-hand throw from the chest. Trains upper-body power without loading a heavy bar.",
    ["Athletic stance, ball at the chest.", "Step and push the ball out as fast as you can.", "Finish with arms fully extended.", "Throw against a wall or to a partner."],
    ["Pushing slowly, like a press.", "Using only the arms with no leg drive.", "A ball so heavy the throw gets slow."],
    ["Push Press", "Push-Ups", "Med Ball Rotational Throws"]
  ),
  ex(
    "Half-Kneeling Landmine Press",
    "Hitting Power",
    "Beginner",
    "🗡️",
    "A one-arm press on an angle from a half-kneeling stance. Shoulder-friendly overhead work that also trains the core.",
    ["Down knee under the hip, glute squeezed.", "Hold the bar end at the shoulder.", "Press up and slightly forward.", "Keep ribs down; don't lean back."],
    ["Arching the lower back to finish the press.", "Letting the hips shift.", "Shrugging at the top."],
    ["Landmine Press or DB Shoulder Press", "Pike Push-Ups", "Push Press"]
  ),
  ex(
    "Bear Crawl",
    "Shoulder Health",
    "Beginner",
    "🐻",
    "Crawling on hands and feet with the knees just off the floor. Builds shoulder stability and core control.",
    ["Hands under shoulders, knees under hips.", "Lift the knees an inch off the floor.", "Move opposite hand and foot together.", "Keep the back flat and hips low."],
    ["Hips rising into the air.", "Big, sloppy steps.", "Letting the knees touch down."],
    ["Scap Push-Ups", "Planks", "Pike Push-Ups"]
  ),
  ex(
    "Wall Slides",
    "Shoulder Health",
    "Beginner",
    "🧱",
    "Sliding the arms up a wall trains the shoulder blades to move well overhead, which hitting and serving need.",
    ["Back and forearms against the wall.", "Ribs down, lower back flat.", "Slide the arms up while keeping contact.", "Slide down and pull the elbows into the sides."],
    ["Arching the back to get the arms higher.", "Shrugging as the arms go up.", "Losing wall contact."],
    ["Y-T-W Raises", "Scap Push-Ups", "Shoulder CARs"]
  ),
  ex(
    "Rear Delt Fly",
    "Shoulder Health",
    "Beginner",
    "🦅",
    "Strengthens the back of the shoulder and the upper back to balance all the pressing and hitting.",
    ["Hinge forward with a flat back.", "Light dumbbells, slight bend in the elbows.", "Raise the arms out to the sides.", "Squeeze, then lower slowly."],
    ["Going too heavy and swinging.", "Shrugging the shoulders.", "Rounding the back."],
    ["Face Pulls", "Band Pull-Aparts", "Y-T-W Raises"]
  ),
  ex(
    "Monster Walks",
    "Knee Strength",
    "Beginner",
    "👣",
    "Walking forward and back with a band around the legs. Builds the hip muscles that keep the knees from caving in.",
    ["Band around the knees or ankles.", "Quarter squat, chest up.", "Step diagonally forward, keeping tension on the band.", "Don't let the feet come together."],
    ["Standing up tall.", "Feet snapping together.", "Knees caving in."],
    ["Lateral Band Walks", "Clamshells", "Glute Bridge"]
  ),
  ex(
    "Single-Leg Calf Raise",
    "Jump Development",
    "Beginner",
    "🦶",
    "Builds calf and Achilles strength one leg at a time, which matters for one-foot takeoffs and landings.",
    ["Stand on one foot on a step edge.", "Rise as high as you can.", "Pause at the top.", "Lower slowly below the step."],
    ["Bouncing out of the bottom.", "Rolling onto the outside of the foot.", "Rushing reps."],
    ["Calf Raises", "Seated Calf Raise", "Soleus Raises"]
  ),
  ex(
    "Wall Toe Raises",
    "Knee Strength",
    "Beginner",
    "🦶",
    "Lifting the toes with your back against a wall. Builds the shin muscles that help absorb landings, with no equipment.",
    ["Back against a wall, heels a foot away.", "Lift the toes as high as you can.", "Pause at the top.", "Lower slowly."],
    ["Bending at the knees or hips.", "Rocking instead of lifting the toes.", "Rushing reps."],
    ["Tibialis Raises", "Ankle Rocks", "Calf Raises"]
  ),
  ex(
    "Half-Kneeling Hip Flexor Stretch",
    "Mobility",
    "Beginner",
    "🧘",
    "Stretches the front of the hip, which gets tight from sitting and from repeated jumping.",
    ["Half-kneel with the back knee under the hip.", "Squeeze the glute on the kneeling side.", "Shift forward slightly without arching.", "Reach the same-side arm up for more stretch."],
    ["Arching the lower back instead of stretching the hip.", "Lunging too far forward.", "Relaxing the glute."],
    ["Couch Stretch", "Hip CARs", "90/90 Hip Switches"]
  ),
  ex(
    "Open Books",
    "Mobility",
    "Beginner",
    "📖",
    "A side-lying upper-back rotation. Improves the thoracic rotation behind a full arm swing.",
    ["Lie on your side, knees bent and stacked.", "Arms straight out in front, palms together.", "Open the top arm across to the other side.", "Follow the hand with your eyes; keep the knees together."],
    ["Knees coming apart as you rotate.", "Forcing the arm to the floor.", "Holding your breath."],
    ["Thoracic Rotations", "Shoulder CARs", "Full-Body Mobility Flow"]
  )
];

export function getExercise(name: string): Exercise | undefined {
  return exercises.find((exercise) => exercise.name === name);
}
