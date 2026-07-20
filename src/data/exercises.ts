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
    ["Goblet Squat", "Safety Bar Squat", "Heel-Elevated Squat"]
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
    ["Nordic Curl", "Swiss Ball Curl", "RDL"]
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
    ["Seated Calf Raise", "Wall Soleus Raise", "Single-Leg Soleus Raise"]
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
    ["Standing Long Jump", "Bounds", "Box Jumps"]
  ),
  ex(
    "Lateral Bounds",
    "Speed & Agility",
    "Intermediate",
    "↔️",
    "Builds side-to-side power for defense and court movement.",
    ["Push off hard.", "Stick the landing.", "Keep hips level.", "Control the knee."],
    ["Rushing.", "Landing sloppy.", "Knee collapsing."],
    ["Skater Jumps", "Lateral Lunges", "Side Hops"]
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
    ["Falling Starts", "Court Sprints", "Hill Sprints"]
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
    ["Pull-Ups", "Lat Pulldown", "Assisted Chin-Up"]
  ),
  ex(
    "DB Bench Press",
    "Hitting Power",
    "Beginner",
    "🏋️",
    "Builds pressing strength with shoulder-friendly movement.",
    ["Shoulder blades back.", "Lower controlled.", "Press strong.", "Keep wrists stacked."],
    ["Flaring elbows.", "Bouncing.", "Shoulders rolling forward."],
    ["Push-Ups", "Machine Chest Press", "Floor Press"]
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
    ["Push-Ups", "DB Bench Press", "Wall Push-Up"]
  ),
  ex(
    "Dips",
    "Hitting Power",
    "Intermediate",
    "🔻",
    "Builds chest, triceps, and calisthenics pressing strength.",
    ["Shoulders down.", "Control depth.", "Press strong.", "Use pain-free range."],
    ["Going too deep.", "Shrugging.", "Bouncing reps."],
    ["Push-Ups", "Bench Dips", "Assisted Dips"]
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
    ["Ring Rows", "TRX Rows", "Cable Row"]
  ),
  ex(
    "Landmine Press or DB Shoulder Press",
    "Hitting Power",
    "Beginner",
    "💥",
    "Builds shoulder pressing power for hitting.",
    ["Brace core.", "Press up strong.", "Keep ribs down.", "Control lowering."],
    ["Arching lower back.", "Shrugging.", "Pressing through pain."],
    ["Half-Kneeling Landmine Press", "Seated DB Press", "Push Press"]
  ),
  ex(
    "Push Press",
    "Hitting Power",
    "Advanced",
    "🚀",
    "Builds explosive pressing power and full-body force transfer.",
    ["Dip straight down.", "Drive with legs.", "Punch overhead.", "Brace hard."],
    ["Turning it into strict press.", "Arching lower back.", "Pressing through pain."],
    ["DB Push Press", "Landmine Press", "Med Ball Chest Pass"]
  ),
  ex(
    "Pike Push-Ups",
    "Hitting Power",
    "Intermediate",
    "🔺",
    "Builds shoulder strength for calisthenics and overhead power.",
    ["Hips high.", "Head moves forward.", "Elbows controlled.", "Press through shoulders."],
    ["Turning into regular push-up.", "Flaring elbows.", "Rushing."],
    ["DB Shoulder Press", "Handstand Progression", "Incline Pike Push-Up"]
  ),
  ex(
    "Handstand Practice",
    "Shoulder Health",
    "Advanced",
    "🤸",
    "Builds shoulder stability, body control, and calisthenics skill.",
    ["Push tall.", "Squeeze glutes.", "Ribs tucked.", "Use fingers for balance."],
    ["Banana back.", "Soft shoulders.", "Kicking up with no control."],
    ["Wall Handstand Hold", "Pike Hold", "Bear Crawl"]
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
    ["Dead Bugs", "Side Planks", "Cable Anti-Rotation Hold"]
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
    ["Band Woodchoppers", "Med Ball Rotational Throws", "Landmine Rotations"]
  ),
  ex(
    "Landmine Rotations",
    "Rotational Core",
    "Intermediate",
    "🔄",
    "Builds rotational trunk strength and power transfer.",
    ["Rotate hips.", "Keep arms strong.", "Brace at finish.", "Move explosively but controlled."],
    ["Only using arms.", "Over-rotating low back.", "Going too heavy."],
    ["Cable Woodchoppers", "Med Ball Throws", "Band Rotations"]
  ),
  ex(
    "Hanging Leg Raises",
    "Rotational Core",
    "Advanced",
    "🧱",
    "Builds core strength, hip flexor strength, and control.",
    ["Control swing.", "Tuck pelvis.", "Raise with abs.", "Lower slowly."],
    ["Swinging wildly.", "Using momentum.", "Arching lower back."],
    ["Hanging Knee Raises", "Reverse Crunch", "Dead Bugs"]
  ),
  ex(
    "L-Sit Practice",
    "Rotational Core",
    "Advanced",
    "🧘",
    "Builds core compression, hip flexors, and calisthenics control.",
    ["Push shoulders down.", "Lock elbows.", "Point toes.", "Keep chest tall."],
    ["Bent arms.", "Collapsed shoulders.", "Holding breath."],
    ["Tuck L-Sit", "Seated Leg Lifts", "Hanging Knee Raises"]
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
    ["Side Plank From Knees", "Copenhagen Plank", "Suitcase Carry"]
  ),
  ex(
    "Planks",
    "Rotational Core",
    "Beginner",
    "🪵",
    "Builds basic trunk stiffness and core endurance.",
    ["Ribs down.", "Squeeze glutes.", "Push floor away.", "Breathe slowly."],
    ["Sagging hips.", "Butt too high.", "Holding breath."],
    ["Dead Bugs", "Hollow Hold", "Stir-the-Pot"]
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
    ["Suitcase Carry", "Trap Bar Carry", "KB Carries"]
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
    ["Lateral Band Walks", "Side-Lying Hip Abduction", "Monster Walks"]
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
    ["Lateral Band Walks", "Single-Leg RDL", "Bosu Balance Hold"]
  ),
  ex(
    "Tibialis Raises",
    "Knee Strength",
    "Beginner",
    "🦶",
    "Strengthens the front of the shin for knee and ankle durability.",
    ["Heels planted.", "Pull toes up hard.", "Control down.", "Use full range."],
    ["Using momentum.", "Tiny reps.", "Rocking hips."],
    ["Tib Bar Raises", "Wall Toe Raises", "Band Dorsiflexion"]
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
    ["Backward Treadmill Walk", "Spanish Squat", "Wall Sit"]
  ),
  ex(
    "Face Pulls",
    "Shoulder Health",
    "Beginner",
    "🧵",
    "Builds rear delts and rotator cuff support.",
    ["Pull toward forehead.", "Elbows high.", "Squeeze shoulder blades.", "Control return."],
    ["Too much weight.", "Turning it into a row.", "Arching back."],
    ["Band Pull-Aparts", "Rear Delt Fly", "Cable External Rotation"]
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
    ["Cable External Rotation", "Side-Lying External Rotation", "Face Pulls"]
  ),
  ex(
    "Scap Push-Ups",
    "Shoulder Health",
    "Beginner",
    "🪽",
    "Builds serratus and scapular control for healthier shoulders.",
    ["Arms straight.", "Push floor away.", "Let shoulder blades move.", "Control reps."],
    ["Bending elbows.", "Rushing.", "Sagging hips."],
    ["Wall Scap Push-Ups", "Serratus Wall Slides", "Bear Crawl Hold"]
  ),
  ex(
    "Y-T-W Raises",
    "Shoulder Health",
    "Beginner",
    "🪽",
    "Strengthens lower traps, rear delts, and shoulder stabilizers.",
    ["Move slow.", "Thumbs up.", "Squeeze gently.", "Use light weight."],
    ["Going too heavy.", "Shrugging.", "Rushing reps."],
    ["Prone Y Raises", "Band Pull-Aparts", "Wall Slides"]
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
    ["Yoga Flow", "Dynamic Stretching", "Joint CARs"]
  ),
  ex(
    "Deep Squat Holds",
    "Mobility",
    "Beginner",
    "🧎",
    "Improves ankle, hip, and squat mobility.",
    ["Heels down if possible.", "Breathe.", "Push knees out gently.", "Relax."],
    ["Forcing painful depth.", "Rounding hard.", "Holding tension."],
    ["Goblet Squat Hold", "Supported Squat Hold", "Ankle Rocks"]
  ),
  ex(
    "Couch Stretch",
    "Mobility",
    "Beginner",
    "🛋️",
    "Opens hip flexors and quads for better jumping posture.",
    ["Squeeze back-leg glute.", "Ribs down.", "Breathe slowly.", "Avoid low-back arch."],
    ["Overarching.", "Forcing knee pain.", "Holding breath."],
    ["Half-Kneeling Hip Flexor Stretch", "Quad Stretch", "Lunge Stretch"]
  ),
  ex(
    "Shoulder CARs",
    "Mobility",
    "Beginner",
    "🔄",
    "Improves shoulder control and range.",
    ["Move slowly.", "Ribs down.", "Pain-free range.", "Control every angle."],
    ["Rushing.", "Arching back.", "Forcing pinching pain."],
    ["Arm Circles", "Wall Slides", "Band Dislocates"]
  ),
  ex(
    "Hip CARs",
    "Mobility",
    "Beginner",
    "🔄",
    "Improves hip control, range, and movement quality.",
    ["Move slow.", "Torso still.", "Pain-free range.", "Control the circle."],
    ["Twisting torso.", "Rushing.", "Forcing pinchy range."],
    ["90/90 Hip Switches", "Hip Circles", "Lunge Mobility"]
  ),
  ex(
    "90/90 Hip Switches",
    "Mobility",
    "Intermediate",
    "🦴",
    "Improves hip rotation for smoother movement and lower-body mechanics.",
    ["Sit tall.", "Rotate slowly.", "Use hands if needed.", "Stay controlled."],
    ["Rushing.", "Forcing knees down.", "Slumping hard."],
    ["Hip CARs", "Pigeon Stretch", "Lunge Mobility"]
  ),
  ex(
    "Ankle Rocks",
    "Mobility",
    "Beginner",
    "🦶",
    "Improves ankle dorsiflexion for squats, landings, and knee tracking.",
    ["Keep heel down.", "Drive knee forward.", "Move slow.", "Use pain-free range."],
    ["Heel lifting.", "Bouncing hard.", "Forcing pain."],
    ["Knee-to-Wall Drill", "Deep Squat Holds", "Calf Stretch"]
  ),
  ex(
    "Thoracic Rotations",
    "Mobility",
    "Beginner",
    "🌀",
    "Improves upper-back rotation for hitting mechanics.",
    ["Rotate through upper back.", "Breathe out.", "Move slow.", "Keep hips stable."],
    ["Twisting low back.", "Rushing.", "Holding breath."],
    ["Open Books", "Thread the Needle", "Quadruped Rotations"]
  ),
  ex(
    "Walk 20-30 minutes",
    "Recovery",
    "Beginner",
    "🚶",
    "Improves recovery and blood flow without beating up your joints.",
    ["Easy pace.", "Relax shoulders.", "Breathe steadily.", "Keep it easy."],
    ["Turning it into conditioning.", "Skipping it because it feels too easy.", "Bad posture."],
    ["Easy Bike", "Light Swim", "Incline Walk"]
  ),
  ex(
    "Light Stretching",
    "Recovery",
    "Beginner",
    "🧘",
    "Helps recovery and keeps joints moving on rest days.",
    ["Stay gentle.", "Breathe slowly.", "Avoid sharp pain.", "Relax into positions."],
    ["Forcing range.", "Stretching aggressively sore muscles.", "Holding breath."],
    ["Mobility Flow", "Yoga", "Foam Rolling"]
  ),
  ex(
    "Foam Roll",
    "Recovery",
    "Beginner",
    "🛞",
    "Helps reduce tightness and improve recovery before or after training.",
    ["Roll slowly.", "Pause on tight spots.", "Breathe.", "Keep pressure tolerable."],
    ["Rolling too fast.", "Crushing painful spots.", "Expecting it to replace strength work."],
    ["Lacrosse Ball", "Massage Gun", "Light Mobility Flow"]
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
    ["Walk 20-30 minutes", "Light Swim", "Incline Walk"]
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
  )
];

export function getExercise(name: string): Exercise | undefined {
  return exercises.find((exercise) => exercise.name === name);
}
