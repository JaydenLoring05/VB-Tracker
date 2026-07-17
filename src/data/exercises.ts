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
  // LOWER BODY
  ex(
    "Trap Bar Deadlift or RDL",
    "Lower Body",
    "Intermediate",
    "🏋️",
    "Builds posterior-chain strength for jumping, landing, and hitting power.",
    ["Brace before lifting.", "Push the floor away.", "Keep your back neutral.", "Control the lowering."],
    ["Rounding your back.", "Jerking the weight.", "Letting knees cave inward."],
    ["Romanian Deadlift", "Kettlebell Deadlift", "Hip Thrust"]
  ),
  ex(
    "Bulgarian Split Squat",
    "Lower Body",
    "Intermediate",
    "🦵",
    "Builds single-leg strength for jumping, cutting, and knee control.",
    ["Control the descent.", "Drive through the front foot.", "Keep knee tracking over toes.", "Stay tall."],
    ["Pushing too much off the back leg.", "Letting knee cave.", "Bouncing reps."],
    ["Reverse Lunge", "Step-Up", "Split Squat"]
  ),
  ex(
    "Hip Thrust",
    "Lower Body",
    "Beginner",
    "🍑",
    "Builds glute strength for jumping, sprinting, and hip extension power.",
    ["Ribs down.", "Drive through heels.", "Squeeze glutes at the top.", "Keep chin tucked."],
    ["Overarching lower back.", "Feet too far away.", "Rushing the top."],
    ["Glute Bridge", "Single-Leg Hip Thrust", "Cable Pull-Through"]
  ),
  ex(
    "Heel-Elevated Goblet Squat",
    "Lower Body",
    "Beginner",
    "🏆",
    "Builds quad strength and knee-friendly squat control.",
    ["Keep torso tall.", "Let knees travel forward.", "Control depth.", "Drive through midfoot."],
    ["Collapsing knees.", "Rushing reps.", "Losing heel pressure."],
    ["Goblet Squat", "Front Squat", "Spanish Squat"]
  ),
  ex(
    "Front Squat",
    "Lower Body",
    "Advanced",
    "🏋️",
    "Builds quad, core, and full-body strength for jumping.",
    ["Elbows high.", "Brace hard.", "Stay upright.", "Drive out of the bottom."],
    ["Dropping elbows.", "Folding forward.", "Going too heavy too soon."],
    ["Goblet Squat", "Safety Bar Squat", "Heel-Elevated Squat"]
  ),
  ex(
    "Step-Ups",
    "Lower Body",
    "Beginner",
    "🪜",
    "Builds single-leg drive and control for jumping and court movement.",
    ["Drive through the working leg.", "Control the lowering.", "Keep knee stable.", "Stand tall at top."],
    ["Pushing off the back foot.", "Dropping down fast.", "Knee collapsing inward."],
    ["Reverse Lunge", "Bulgarian Split Squat", "Split Squat"]
  ),
  ex(
    "Reverse Lunges",
    "Lower Body",
    "Beginner",
    "↩️",
    "Builds single-leg strength with less knee stress than forward lunges.",
    ["Step back under control.", "Keep front foot planted.", "Drive up strong.", "Stay balanced."],
    ["Pushing off the back leg too much.", "Leaning forward.", "Slamming the knee down."],
    ["Split Squat", "Step-Up", "Bulgarian Split Squat"]
  ),
  ex(
    "Hamstring Curls",
    "Lower Body",
    "Beginner",
    "🧵",
    "Strengthens hamstrings for sprinting, jumping, and knee protection.",
    ["Curl smoothly.", "Pause at the top.", "Control the lowering.", "Keep hips stable."],
    ["Rushing reps.", "Using momentum.", "Arching lower back."],
    ["Nordic Curl", "Swiss Ball Curl", "RDL"]
  ),
  ex(
    "Nordic Hamstring Curl",
    "Lower Body",
    "Advanced",
    "🧊",
    "Builds elite hamstring strength and injury resistance.",
    ["Lower slowly.", "Keep hips extended.", "Use hands to catch.", "Start with partial range."],
    ["Dropping too fast.", "Breaking at the hips.", "Doing too much volume."],
    ["Hamstring Curl", "RDL", "Swiss Ball Curl"]
  ),
  ex(
    "Calf Raises",
    "Lower Body",
    "Beginner",
    "🦶",
    "Builds ankle strength and lower-leg durability for jumping.",
    ["Use full range.", "Pause at top.", "Control down.", "Keep ankles straight."],
    ["Bouncing reps.", "Rolling ankles.", "Cutting range short."],
    ["Single-Leg Calf Raise", "Seated Calf Raise", "Pogo Hops"]
  ),
  ex(
    "Soleus Raises",
    "Lower Body",
    "Beginner",
    "🦶",
    "Builds bent-knee calf strength for landing, acceleration, and knee support.",
    ["Keep knee bent.", "Raise heel high.", "Control down.", "Use slow reps."],
    ["Straightening the knee.", "Bouncing.", "Going too heavy too soon."],
    ["Seated Calf Raise", "Wall Soleus Raise", "Single-Leg Soleus Raise"]
  ),

  // PLYOMETRICS / SPEED
  ex(
    "Approach Jumps",
    "Plyometrics",
    "Advanced",
    "🏐",
    "Transfers strength into volleyball-specific jumping.",
    ["Fast last two steps.", "Swing arms hard.", "Jump tall.", "Land softly."],
    ["Doing too many tired reps.", "Slow approach.", "Stiff landings."],
    ["Standing Vertical Jumps", "Box Jumps", "Broad Jumps"]
  ),
  ex(
    "Box Jumps",
    "Plyometrics",
    "Intermediate",
    "📦",
    "Builds explosive jumping power with lower landing stress.",
    ["Jump explosively.", "Land quietly.", "Step down.", "Keep reps crisp."],
    ["Using a box too high.", "Landing in a deep squat.", "Doing conditioning reps."],
    ["Squat Jumps", "Approach Jumps", "Broad Jumps"]
  ),
  ex(
    "Broad Jumps",
    "Plyometrics",
    "Intermediate",
    "🚀",
    "Builds horizontal power for approach speed and explosiveness.",
    ["Load hips back.", "Swing arms hard.", "Jump forward.", "Stick landing."],
    ["Landing stiff.", "Knees caving.", "Rushing reps."],
    ["Standing Long Jump", "Bounds", "Box Jumps"]
  ),
  ex(
    "Lateral Bounds",
    "Plyometrics",
    "Intermediate",
    "↔️",
    "Builds side-to-side power for defense and court movement.",
    ["Push off hard.", "Stick the landing.", "Keep hips level.", "Control the knee."],
    ["Rushing.", "Landing sloppy.", "Knee collapsing."],
    ["Skater Jumps", "Lateral Lunges", "Side Hops"]
  ),
  ex(
    "Landing Mechanics Drill",
    "Plyometrics",
    "Beginner",
    "🎯",
    "Teaches the soft-knee, hips-back, quiet landing pattern that every jump and plyo exercise depends on -- do this before adding jump volume, not after.",
    ["Step off a low box or hop lightly in place.", "Land with hips back and knees soft.", "Land as quietly as possible.", "Freeze for 2 seconds on landing to prove control."],
    ["Landing stiff-legged.", "Knees caving inward on contact.", "Landing loud -- that's a sign of too much force hitting the joints."],
    ["Depth Drops", "Box Step-Offs", "Drop Squat"]
  ),
  ex(
    "Pogo Hops",
    "Plyometrics",
    "Beginner",
    "🦘",
    "Builds ankle stiffness and reactive bounce.",
    ["Stay tall.", "Bounce off the balls of feet.", "Keep knees soft.", "Be quick off the floor."],
    ["Landing heavy.", "Bending knees too much.", "Doing too many tired reps."],
    ["Jump Rope", "Calf Raises", "Line Hops"]
  ),
  ex(
    "Depth Drops",
    "Plyometrics",
    "Intermediate",
    "⬇️",
    "Builds landing mechanics and tendon tolerance.",
    ["Step off, do not jump.", "Land quietly.", "Knees track over toes.", "Stick the landing."],
    ["Landing stiff.", "Knees caving.", "Using too high of a box."],
    ["Snap Downs", "Box Step-Offs", "Drop Squat"]
  ),
  ex(
    "Drop Jumps",
    "Plyometrics",
    "Advanced",
    "⚡",
    "Builds reactive jumping ability and fast ground contact.",
    ["Land and rebound quickly.", "Stay stiff but controlled.", "Use arms.", "Keep reps low quality high."],
    ["Ground contact too long.", "Landing loud.", "Doing them fatigued."],
    ["Pogo Hops", "Depth Drops", "Box Jumps"]
  ),
  ex(
    "Sprint Starts",
    "Plyometrics",
    "Intermediate",
    "💨",
    "Builds acceleration for approaches and defensive reactions.",
    ["Lean forward.", "Push the ground back.", "Explode first 3 steps.", "Stay low early."],
    ["Standing up too soon.", "Weak first step.", "Running tired reps."],
    ["Falling Starts", "Court Sprints", "Hill Sprints"]
  ),
  ex(
    "Court Sprints",
    "Plyometrics",
    "Beginner",
    "🏃",
    "Builds volleyball-specific conditioning and acceleration.",
    ["Stay low.", "Push hard.", "Stop under control.", "Keep reps sharp."],
    ["Jogging.", "Sloppy stops.", "Too much volume."],
    ["Shuttle Runs", "Sprint Starts", "Lateral Bounds"]
  ),
  ex(
    "Jump Rope",
    "Plyometrics",
    "Beginner",
    "🪢",
    "Builds ankle rhythm, foot speed, and conditioning.",
    ["Stay light.", "Small bounces.", "Keep wrists relaxed.", "Land quietly."],
    ["Jumping too high.", "Landing heavy.", "Using shoulders too much."],
    ["Pogo Hops", "Line Hops", "Easy Bike"]
  ),

  // UPPER BODY
  ex(
    "Pull-Ups",
    "Upper Body",
    "Intermediate",
    "💪",
    "Builds back strength for hitting power, shoulder health, and calisthenics.",
    ["Start from dead hang.", "Pull chest toward bar.", "Drive elbows down.", "Control down."],
    ["Half reps.", "Kipping every rep.", "Shrugging shoulders."],
    ["Band-Assisted Pull-Up", "Lat Pulldown", "Bodyweight Row"]
  ),
  ex(
    "Band-Assisted Pull-Up",
    "Upper Body",
    "Beginner",
    "🎗️",
    "Builds toward a full pull-up by removing just enough bodyweight to keep every rep clean.",
    ["Loop a band around the bar and under a foot or knee.", "Full dead hang at the bottom.", "Pull chest toward the bar.", "Use the lightest band that still lets you finish the set with good form."],
    ["Using a band so strong it does all the work.", "Half reps.", "Kipping instead of pulling."],
    ["Pull-Ups", "Lat Pulldown", "Bodyweight Row"]
  ),
  ex(
    "Chin-Ups",
    "Upper Body",
    "Intermediate",
    "💪",
    "Builds lats, biceps, and pulling strength.",
    ["Use full range.", "Pull elbows down.", "Keep ribs controlled.", "Lower slowly."],
    ["Half reps.", "Swinging.", "Neck reaching for bar."],
    ["Pull-Ups", "Lat Pulldown", "Assisted Chin-Up"]
  ),
  ex(
    "DB Bench Press",
    "Upper Body",
    "Beginner",
    "🏋️",
    "Builds pressing strength with shoulder-friendly movement.",
    ["Shoulder blades back.", "Lower controlled.", "Press strong.", "Keep wrists stacked."],
    ["Flaring elbows.", "Bouncing.", "Shoulders rolling forward."],
    ["Push-Ups", "Machine Chest Press", "Floor Press"]
  ),
  ex(
    "Push-Ups",
    "Upper Body",
    "Beginner",
    "⬆️",
    "Builds chest, triceps, shoulder control, and core stiffness.",
    ["Body straight.", "Elbows controlled.", "Chest lowers first.", "Push floor away."],
    ["Sagging hips.", "Flaring elbows.", "Half reps."],
    ["Incline Push-Up", "DB Bench Press", "Dips"]
  ),
  ex(
    "Incline Push-Up",
    "Upper Body",
    "Beginner",
    "📐",
    "The entry point into pressing strength -- hands elevated on a bench or box to reduce the load until a full push-up is ready.",
    ["Hands on a sturdy elevated surface.", "Body straight from head to heel.", "Chest lowers first.", "Lower the surface height as you get stronger."],
    ["Sagging hips.", "Surface too low too soon.", "Flaring elbows."],
    ["Push-Ups", "DB Bench Press", "Wall Push-Up"]
  ),
  ex(
    "Dips",
    "Upper Body",
    "Intermediate",
    "🔻",
    "Builds chest, triceps, and calisthenics pressing strength.",
    ["Shoulders down.", "Control depth.", "Press strong.", "Use pain-free range."],
    ["Going too deep.", "Shrugging.", "Bouncing reps."],
    ["Push-Ups", "Bench Dips", "Assisted Dips"]
  ),
  ex(
    "Single-Arm Row",
    "Upper Body",
    "Beginner",
    "🛶",
    "Builds back strength and shoulder balance.",
    ["Pull elbow to hip.", "Keep torso still.", "Squeeze back.", "Control down."],
    ["Twisting body.", "Shrugging.", "Yanking weight."],
    ["Chest-Supported Row", "Cable Row", "Bodyweight Row"]
  ),
  ex(
    "Bodyweight Rows",
    "Upper Body",
    "Beginner",
    "🛶",
    "Builds pulling endurance and shoulder balance.",
    ["Body straight.", "Pull chest to bar.", "Squeeze shoulder blades.", "Control down."],
    ["Sagging hips.", "Half reps.", "Shrugging."],
    ["Ring Rows", "TRX Rows", "Cable Row"]
  ),
  ex(
    "Landmine Press or DB Shoulder Press",
    "Upper Body",
    "Beginner",
    "💥",
    "Builds shoulder pressing power for hitting.",
    ["Brace core.", "Press up strong.", "Keep ribs down.", "Control lowering."],
    ["Arching lower back.", "Shrugging.", "Pressing through pain."],
    ["Half-Kneeling Landmine Press", "Seated DB Press", "Push Press"]
  ),
  ex(
    "Push Press",
    "Upper Body",
    "Advanced",
    "🚀",
    "Builds explosive pressing power and full-body force transfer.",
    ["Dip straight down.", "Drive with legs.", "Punch overhead.", "Brace hard."],
    ["Turning it into strict press.", "Arching lower back.", "Pressing through pain."],
    ["DB Push Press", "Landmine Press", "Med Ball Chest Pass"]
  ),
  ex(
    "Pike Push-Ups",
    "Upper Body",
    "Intermediate",
    "🔺",
    "Builds shoulder strength for calisthenics and overhead power.",
    ["Hips high.", "Head moves forward.", "Elbows controlled.", "Press through shoulders."],
    ["Turning into regular push-up.", "Flaring elbows.", "Rushing."],
    ["DB Shoulder Press", "Handstand Progression", "Incline Pike Push-Up"]
  ),
  ex(
    "Handstand Practice",
    "Upper Body",
    "Advanced",
    "🤸",
    "Builds shoulder stability, body control, and calisthenics skill.",
    ["Push tall.", "Squeeze glutes.", "Ribs tucked.", "Use fingers for balance."],
    ["Banana back.", "Soft shoulders.", "Kicking up with no control."],
    ["Wall Handstand Hold", "Pike Hold", "Bear Crawl"]
  ),

  // CORE / ROTATION
  ex(
    "Pallof Press",
    "Core",
    "Beginner",
    "🧱",
    "Builds anti-rotation core strength for hitting stability.",
    ["Brace hard.", "Press straight out.", "Do not rotate.", "Move slow."],
    ["Twisting with band.", "Shrugging.", "Too much weight."],
    ["Dead Bug", "Side Plank", "Cable Anti-Rotation Hold"]
  ),
  ex(
    "Med Ball Rotational Throws",
    "Core",
    "Intermediate",
    "🔁",
    "Builds rotational power for harder hitting.",
    ["Rotate hips first.", "Throw explosively.", "Brace core.", "Reset each rep."],
    ["Only using arms.", "Rushing reps.", "Knees caving."],
    ["Cable Woodchoppers", "Landmine Rotations", "Band Rotations"]
  ),
  ex(
    "Cable Woodchoppers",
    "Core",
    "Intermediate",
    "🪓",
    "Builds rotational strength and control for hitting.",
    ["Rotate through hips and ribs.", "Keep arms long.", "Control back.", "Brace core."],
    ["Only pulling with arms.", "Using too much weight.", "Twisting knees awkwardly."],
    ["Band Woodchoppers", "Med Ball Rotational Throws", "Landmine Rotations"]
  ),
  ex(
    "Landmine Rotations",
    "Core",
    "Intermediate",
    "🔄",
    "Builds rotational trunk strength and power transfer.",
    ["Rotate hips.", "Keep arms strong.", "Brace at finish.", "Move explosively but controlled."],
    ["Only using arms.", "Over-rotating low back.", "Going too heavy."],
    ["Cable Woodchoppers", "Med Ball Throws", "Band Rotations"]
  ),
  ex(
    "Hanging Leg Raises",
    "Core",
    "Advanced",
    "🧱",
    "Builds core strength, hip flexor strength, and control.",
    ["Control swing.", "Tuck pelvis.", "Raise with abs.", "Lower slowly."],
    ["Swinging wildly.", "Using momentum.", "Arching lower back."],
    ["Hanging Knee Raises", "Reverse Crunch", "Dead Bug"]
  ),
  ex(
    "L-Sit Practice",
    "Core",
    "Advanced",
    "🧘",
    "Builds core compression, hip flexors, and calisthenics control.",
    ["Push shoulders down.", "Lock elbows.", "Point toes.", "Keep chest tall."],
    ["Bent arms.", "Collapsed shoulders.", "Holding breath."],
    ["Tuck L-Sit", "Seated Leg Lifts", "Hanging Knee Raises"]
  ),
  ex(
    "Dead Bugs",
    "Core",
    "Beginner",
    "🐞",
    "Builds core control and lower-back stability.",
    ["Low back gently into floor.", "Move opposite arm and leg.", "Exhale as you extend.", "Go slow."],
    ["Arching lower back.", "Moving too fast.", "Holding breath."],
    ["Bird Dog", "Pallof Press", "Hollow Hold"]
  ),
  ex(
    "Side Planks",
    "Core",
    "Beginner",
    "📏",
    "Builds lateral core strength for hitting and landing control.",
    ["Stack shoulders and hips.", "Push floor away.", "Squeeze glutes.", "Stay long."],
    ["Sagging hips.", "Rotating forward.", "Holding breath."],
    ["Side Plank From Knees", "Copenhagen Plank", "Suitcase Carry"]
  ),
  ex(
    "Planks",
    "Core",
    "Beginner",
    "🪵",
    "Builds basic trunk stiffness and core endurance.",
    ["Ribs down.", "Squeeze glutes.", "Push floor away.", "Breathe slowly."],
    ["Sagging hips.", "Butt too high.", "Holding breath."],
    ["Dead Bug", "Hollow Hold", "Stir-the-Pot"]
  ),
  ex(
    "Ab Wheel Rollout",
    "Core",
    "Advanced",
    "⚙️",
    "Builds strong anti-extension core strength.",
    ["Ribs down.", "Glutes tight.", "Roll only as far as you control.", "Pull back with abs."],
    ["Arching lower back.", "Going too far.", "Rushing."],
    ["Stability Ball Rollout", "Dead Bug", "Plank"]
  ),
  ex(
    "Back Extensions",
    "Core",
    "Beginner",
    "🛡️",
    "Strengthens lower back, glutes, and hamstrings.",
    ["Move through hips.", "Squeeze glutes.", "Neutral spine.", "Control reps."],
    ["Overextending back.", "Swinging.", "Going too fast."],
    ["Bird Dog", "RDL", "Hip Thrust"]
  ),
  ex(
    "Farmer Carries",
    "Core",
    "Beginner",
    "🧳",
    "Builds grip, traps, core stiffness, and durability.",
    ["Stand tall.", "Brace core.", "Walk controlled.", "Do not lean."],
    ["Letting weights swing.", "Shrugging hard.", "Walking sloppy."],
    ["Suitcase Carry", "Trap Bar Carry", "KB Carries"]
  ),

  // KNEE / SHOULDER REHAB
  ex(
    "Lateral Band Walks",
    "Rehab",
    "Beginner",
    "🎗️",
    "Trains the hip abductors and glute medius directly -- weak hip abductors are one of the biggest modifiable risk factors for knee valgus (caving-in) collapse on landing.",
    ["Band above the knees or around the ankles.", "Slight knee bend throughout.", "Step sideways under tension, don't let the band go slack.", "Keep toes forward, hips level."],
    ["Standing too upright.", "Letting the band go slack between steps.", "Knees caving inward instead of pushing out against the band."],
    ["Clamshells", "Monster Walks", "Single-Leg Balance Reach"]
  ),
  ex(
    "Clamshells",
    "Rehab",
    "Beginner",
    "🐚",
    "Isolates the glute medius to build hip control that keeps the knee tracking properly on landing and cutting.",
    ["Lie on your side, knees bent, feet together.", "Keep hips stacked, don't roll back.", "Lift the top knee using the glute, not momentum.", "Lower with control."],
    ["Rolling the hips backward to fake more range.", "Using momentum instead of the muscle.", "Going too fast."],
    ["Lateral Band Walks", "Side-Lying Hip Abduction", "Monster Walks"]
  ),
  ex(
    "Spanish Squat",
    "Rehab",
    "Intermediate",
    "🦿",
    "Builds quad and patellar tendon tolerance for knee health.",
    ["Stay upright.", "Sit back into band.", "Keep quad tension.", "Use pain-free pressure."],
    ["Relaxing at bottom.", "Knees caving.", "Going into sharp pain."],
    ["Wall Sit", "Reverse Sled Drag", "Patrick Step"]
  ),
  ex(
    "Single-Leg Balance Reach",
    "Rehab",
    "Beginner",
    "🎯",
    "Trains proprioception and single-leg stability -- ACL-prevention research consistently pairs balance training with strength training, not strength alone.",
    ["Stand tall on one leg, soft knee.", "Reach the free foot forward, side, and back under control.", "Keep the standing knee tracking over the toes.", "Return to a stable center each rep."],
    ["Standing knee caving in on the reach.", "Rushing through reaches without control.", "Letting the hips drop on the standing side."],
    ["Lateral Band Walks", "Single-Leg RDL", "Bosu Balance Hold"]
  ),
  ex(
    "Tibialis Raises",
    "Rehab",
    "Beginner",
    "🦶",
    "Strengthens the front of the shin for knee and ankle durability.",
    ["Heels planted.", "Pull toes up hard.", "Control down.", "Use full range."],
    ["Using momentum.", "Tiny reps.", "Rocking hips."],
    ["Tib Bar Raises", "Wall Toe Raises", "Band Dorsiflexion"]
  ),
  ex(
    "Patrick Step",
    "Rehab",
    "Intermediate",
    "🦵",
    "Builds knee control and tendon tolerance through controlled range.",
    ["Move slow.", "Let knee travel forward.", "Keep heel down if possible.", "Stay pain-free."],
    ["Dropping fast.", "Forcing pain.", "Knee caving."],
    ["Poliquin Step-Down", "Spanish Squat", "Reverse Sled Drag"]
  ),
  ex(
    "Poliquin Step-Down",
    "Rehab",
    "Intermediate",
    "📉",
    "Builds VMO and knee control for jumper's knee prevention.",
    ["Control the lowering.", "Tap heel lightly.", "Keep knee tracking.", "Stay upright."],
    ["Dropping too fast.", "Collapsing knee.", "Using too high of a step."],
    ["Patrick Step", "Step-Up", "Spanish Squat"]
  ),
  ex(
    "Reverse Sled Drag",
    "Rehab",
    "Beginner",
    "🛷",
    "Builds quad strength and knee blood flow with low joint stress.",
    ["Stay low.", "Push through toes.", "Keep constant steps.", "Do not rush."],
    ["Standing too tall.", "Taking huge steps.", "Going too heavy."],
    ["Backward Treadmill Walk", "Spanish Squat", "Wall Sit"]
  ),
  ex(
    "Face Pulls",
    "Rehab",
    "Beginner",
    "🧵",
    "Builds rear delts and rotator cuff support.",
    ["Pull toward forehead.", "Elbows high.", "Squeeze shoulder blades.", "Control return."],
    ["Too much weight.", "Turning it into a row.", "Arching back."],
    ["Band Pull-Aparts", "Rear Delt Fly", "Cable External Rotation"]
  ),
  ex(
    "Band Pull-Aparts",
    "Rehab",
    "Beginner",
    "🟡",
    "Builds rear delt and upper-back endurance for shoulder health.",
    ["Arms straight.", "Pull to chest.", "Squeeze shoulder blades.", "Control in."],
    ["Shrugging.", "Bending elbows too much.", "Snapping back."],
    ["Face Pulls", "Rear Delt Fly", "Y-T-W Raises"]
  ),
  ex(
    "External Rotations",
    "Rehab",
    "Beginner",
    "🔧",
    "Strengthens the rotator cuff to protect your shoulder during hitting.",
    ["Elbow tucked.", "Move slowly.", "Use light resistance.", "Stop before pain."],
    ["Too heavy.", "Elbow drifting.", "Twisting torso."],
    ["Cable External Rotation", "Side-Lying External Rotation", "Face Pulls"]
  ),
  ex(
    "Scap Push-Ups",
    "Rehab",
    "Beginner",
    "🪽",
    "Builds serratus and scapular control for healthier shoulders.",
    ["Arms straight.", "Push floor away.", "Let shoulder blades move.", "Control reps."],
    ["Bending elbows.", "Rushing.", "Sagging hips."],
    ["Wall Scap Push-Ups", "Serratus Wall Slides", "Bear Crawl Hold"]
  ),
  ex(
    "Y-T-W Raises",
    "Rehab",
    "Beginner",
    "🪽",
    "Strengthens lower traps, rear delts, and shoulder stabilizers.",
    ["Move slow.", "Thumbs up.", "Squeeze gently.", "Use light weight."],
    ["Going too heavy.", "Shrugging.", "Rushing reps."],
    ["Prone Y Raises", "Band Pull-Aparts", "Wall Slides"]
  ),
  ex(
    "Cuban Rotations",
    "Rehab",
    "Intermediate",
    "🔄",
    "Builds rotator cuff strength and shoulder control.",
    ["Use very light weight.", "Move slow.", "Stay controlled.", "No pain."],
    ["Going heavy.", "Rushing.", "Forcing range."],
    ["External Rotations", "Face Pulls", "Y-T-W Raises"]
  ),
  ex(
    "Light Shoulder Band Work",
    "Rehab",
    "Beginner",
    "🟡",
    "Keeps rotator cuff and shoulders ready for hitting.",
    ["Light tension.", "Move slow.", "No shrugging.", "Feel shoulder, not neck."],
    ["Too much resistance.", "Rushing.", "Working through pain."],
    ["Band Pull-Aparts", "External Rotations", "Face Pulls"]
  ),

  // MOBILITY / RECOVERY
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
    ["Knee-to-Wall Drill", "Deep Squat Hold", "Calf Stretch"]
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
    "Mobility",
    "Beginner",
    "🚶",
    "Improves recovery and blood flow without beating up your joints.",
    ["Easy pace.", "Relax shoulders.", "Breathe steadily.", "Keep it easy."],
    ["Turning it into conditioning.", "Skipping it because it feels too easy.", "Bad posture."],
    ["Easy Bike", "Light Swim", "Incline Walk"]
  ),
  ex(
    "Light Stretching",
    "Mobility",
    "Beginner",
    "🧘",
    "Helps recovery and keeps joints moving on rest days.",
    ["Stay gentle.", "Breathe slowly.", "Avoid sharp pain.", "Relax into positions."],
    ["Forcing range.", "Stretching aggressively sore muscles.", "Holding breath."],
    ["Mobility Flow", "Yoga", "Foam Rolling"]
  ),
  ex(
    "Foam Roll",
    "Mobility",
    "Beginner",
    "🛞",
    "Helps reduce tightness and improve recovery before or after training.",
    ["Roll slowly.", "Pause on tight spots.", "Breathe.", "Keep pressure tolerable."],
    ["Rolling too fast.", "Crushing painful spots.", "Expecting it to replace strength work."],
    ["Lacrosse Ball", "Massage Gun", "Light Mobility Flow"]
  )
];
