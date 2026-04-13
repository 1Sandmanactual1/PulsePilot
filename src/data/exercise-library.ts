import { ExerciseCategory, ExerciseDefinition, ExerciseMuscleTarget } from "@/types/domain";

export const exerciseCategoryOrder: ExerciseCategory[] = [
  "Abs",
  "Back",
  "Biceps",
  "Cardio",
  "Chest",
  "Forearms",
  "Legs",
  "Shoulders",
  "Triceps"
];

function buildTargetChart(primaryMuscles: string[], secondaryMuscles: string[]): ExerciseMuscleTarget[] {
  const primaryShare = primaryMuscles.length ? 70 / primaryMuscles.length : 0;
  const secondaryShare = secondaryMuscles.length ? 30 / secondaryMuscles.length : 0;
  const chart = new Map<string, number>();

  primaryMuscles.forEach((muscle) => {
    chart.set(muscle, (chart.get(muscle) ?? 0) + primaryShare);
  });

  secondaryMuscles.forEach((muscle) => {
    chart.set(muscle, (chart.get(muscle) ?? 0) + secondaryShare);
  });

  return [...chart.entries()]
    .map(([muscle, percent]) => ({ muscle, percent: Math.round(percent) }))
    .sort((left, right) => right.percent - left.percent);
}

function defineExercise(
  id: string,
  name: string,
  category: ExerciseCategory,
  primaryMuscles: string[],
  secondaryMuscles: string[],
  movementPattern: string,
  whyItWorks: string,
  substitutions: string[],
  aliases: string[] = []
): ExerciseDefinition {
  return {
    id,
    name,
    aliases,
    category,
    movementPattern,
    primaryMuscles,
    secondaryMuscles,
    targetChart: buildTargetChart(primaryMuscles, secondaryMuscles),
    whyItWorks,
    substitutions
  };
}

export const exerciseLibrary: ExerciseDefinition[] = [
  defineExercise("ab-wheel-rollout", "Ab Wheel Rollout", "Abs", ["Rectus abdominis", "Transverse abdominis"], ["Obliques", "Lats"], "Anti-extension", "Builds high-tension core bracing and teaches the torso to resist spinal extension.", ["Stability Ball Rollout", "Body Saw"], ["Ab-Wheel Rollout"]),
  defineExercise("cable-crunch", "Cable Crunch", "Abs", ["Rectus abdominis"], ["Obliques"], "Spinal flexion", "Loads trunk flexion directly so the abs can be trained through a strong shortened range.", ["Crunch Machine", "Decline Crunch"]),
  defineExercise("crunch", "Crunch", "Abs", ["Rectus abdominis"], ["Obliques"], "Spinal flexion", "Simple trunk-flexion movement that biases the upper abs with minimal setup.", ["Decline Crunch", "Machine Crunch"], ["Sit-Up Crunch"]),
  defineExercise("dragon-flag", "Dragon Flag", "Abs", ["Rectus abdominis", "Transverse abdominis"], ["Lats", "Hip flexors"], "Anti-extension", "Demands full-body tension and extreme trunk control through the lowering phase.", ["Hollow Body Hold", "Toes-to-Bar"]),
  defineExercise("hanging-knee-raise", "Hanging Knee Raise", "Abs", ["Lower rectus abdominis"], ["Hip flexors", "Obliques"], "Hip flexion", "Builds lower-ab control while teaching pelvic tilt under load.", ["Captain's Chair Knee Raise", "Reverse Crunch"]),
  defineExercise("hanging-leg-raise", "Hanging Leg Raise", "Abs", ["Rectus abdominis"], ["Hip flexors", "Obliques"], "Hip flexion", "Adds a longer lever than knee raises so the abs must create more posterior pelvic tilt.", ["Toes-to-Bar", "Supine Leg Raise"]),
  defineExercise("plank", "Plank", "Abs", ["Transverse abdominis"], ["Rectus abdominis", "Obliques"], "Anti-extension", "Trains full-core stiffness and bracing without spinal movement.", ["RKC Plank", "Body Saw"], ["Front Plank"]),
  defineExercise("russian-twist", "Russian Twist", "Abs", ["Obliques"], ["Rectus abdominis", "Hip flexors"], "Rotation", "Builds rotational control and oblique endurance through repeated trunk turning.", ["Cable Wood Chop", "Rotary Torso"]),
  defineExercise("side-plank", "Side Plank", "Abs", ["Obliques", "Quadratus lumborum"], ["Glute medius"], "Anti-lateral flexion", "Trains side-core stiffness that carries into squats, carries, and unilateral work.", ["Copenhagen Plank", "Suitcase Carry"]),
  defineExercise("v-up", "V-Up", "Abs", ["Rectus abdominis"], ["Hip flexors"], "Spinal flexion", "Challenges the abs through combined trunk and hip flexion with a long lever.", ["Toe Touch Crunch", "Hollow Rock"]),

  defineExercise("back-extension", "Back Extension", "Back", ["Spinal erectors"], ["Glutes", "Hamstrings"], "Hip hinge", "Strengthens the spinal erectors and teaches controlled hip extension.", ["45-Degree Back Extension", "Reverse Hyper"]),
  defineExercise("barbell-row", "Barbell Row", "Back", ["Lats", "Mid traps", "Rhomboids"], ["Rear delts", "Biceps", "Spinal erectors"], "Horizontal pull", "Builds upper-back thickness and loaded pulling strength.", ["Chest-Supported Row", "Cable Row"], ["Bent-Over Row"]),
  defineExercise("barbell-shrug", "Barbell Shrug", "Back", ["Upper traps"], ["Forearms"], "Scapular elevation", "Directly overloads the upper traps with simple progressive loading.", ["Dumbbell Shrug", "Machine Shrug"]),
  defineExercise("cable-row", "Cable Row", "Back", ["Lats", "Rhomboids"], ["Biceps", "Rear delts"], "Horizontal pull", "Gives a stable rowing pattern with smooth resistance and easy load changes.", ["Seated Cable Row", "Machine Row"]),
  defineExercise("chin-up", "Chin-Up", "Back", ["Lats"], ["Biceps", "Lower traps"], "Vertical pull", "Combines strong lat loading with arm involvement and useful bodyweight strength.", ["Neutral-Grip Pull-Up", "Lat Pulldown"]),
  defineExercise("deadlift", "Deadlift", "Back", ["Spinal erectors", "Lats"], ["Glutes", "Hamstrings", "Forearms"], "Hip hinge", "Builds total posterior-chain and upper-back strength while teaching whole-body tension.", ["Trap Bar Deadlift", "Rack Pull"], ["Conventional Deadlift"]),
  defineExercise("dumbbell-row", "Dumbbell Row", "Back", ["Lats", "Rhomboids"], ["Biceps", "Rear delts"], "Horizontal pull", "Lets each side row through a long range of motion with a stable torso setup.", ["One-Arm Row", "Chest-Supported Dumbbell Row"], ["One-Arm Dumbbell Row"]),
  defineExercise("lat-pulldown", "Lat Pulldown", "Back", ["Lats"], ["Biceps", "Teres major"], "Vertical pull", "Makes vertical pulling scalable and easy to progress when pull-ups are not ready yet.", ["Pull-Up", "Assisted Pull-Up"]),
  defineExercise("rack-pull", "Rack Pull", "Back", ["Upper back", "Spinal erectors"], ["Glutes", "Hamstrings", "Forearms"], "Hip hinge", "Overloads the lockout and upper-back portion of the deadlift pattern.", ["Block Pull", "Deadlift from Pins"]),
  defineExercise("t-bar-row", "T-Bar Row", "Back", ["Lats", "Mid back"], ["Biceps", "Rear delts"], "Horizontal pull", "Allows heavy rowing with a fixed path that strongly biases mid-back thickness.", ["Landmine Row", "Chest-Supported T-Bar Row"]),

  defineExercise("barbell-curl", "Barbell Curl", "Biceps", ["Biceps brachii"], ["Brachialis", "Forearms"], "Elbow flexion", "Classic bilateral curl that loads the biceps heavily through the mid-range.", ["EZ-Bar Curl", "Cable Curl"]),
  defineExercise("cable-curl", "Cable Curl", "Biceps", ["Biceps brachii"], ["Brachialis"], "Elbow flexion", "Keeps constant tension on the elbow flexors through the whole rep.", ["Standing Cable Curl", "Bayesian Curl"]),
  defineExercise("concentration-curl", "Concentration Curl", "Biceps", ["Biceps brachii"], ["Brachialis"], "Elbow flexion", "Reduces momentum and isolates elbow flexion in a shortened range.", ["Spider Curl", "Preacher Curl"]),
  defineExercise("dumbbell-curl", "Dumbbell Curl", "Biceps", ["Biceps brachii"], ["Forearms"], "Elbow flexion", "Simple unilateral curl that lets both arms supinate freely.", ["Alternating Dumbbell Curl", "Cable Curl"]),
  defineExercise("ez-bar-curl", "EZ-Bar Curl", "Biceps", ["Biceps brachii"], ["Brachialis", "Forearms"], "Elbow flexion", "Uses a friendlier wrist position than a straight bar while still allowing heavy loading.", ["Barbell Curl", "Preacher Curl"]),
  defineExercise("hammer-curl", "Hammer Curl", "Biceps", ["Brachialis", "Brachioradialis"], ["Biceps brachii"], "Neutral-grip elbow flexion", "Biases the brachialis and brachioradialis to build arm thickness and grip carryover.", ["Dumbbell Hammer Curl", "Rope Hammer Curl"]),
  defineExercise("incline-dumbbell-curl", "Incline Dumbbell Curl", "Biceps", ["Biceps brachii"], ["Brachialis"], "Elbow flexion", "Lengthens the biceps at the shoulder for a strong stretch-mediated stimulus.", ["Seated Incline Dumbbell Curl", "Bayesian Curl"]),
  defineExercise("preacher-curl", "Preacher Curl", "Biceps", ["Biceps brachii"], ["Brachialis"], "Elbow flexion", "Locks the upper arm in place to limit cheating and hit the bottom range hard.", ["EZ-Bar Preacher Curl", "Machine Preacher Curl"]),
  defineExercise("spider-curl", "Spider Curl", "Biceps", ["Biceps brachii"], ["Brachialis"], "Elbow flexion", "Biases the shortened position of the curl with strict upper-arm positioning.", ["Concentration Curl", "Preacher Curl"]),
  defineExercise("zottman-curl", "Zottman Curl", "Biceps", ["Biceps brachii", "Brachioradialis"], ["Forearm extensors"], "Supination/pronation curl", "Trains biceps on the way up and forearms on the controlled lowering phase.", ["Zottman Bicep Curl With Dumbbells"]),

  defineExercise("cycling", "Cycling", "Cardio", ["Quadriceps", "Glutes"], ["Hamstrings", "Calves"], "Steady-state cardio", "Builds aerobic capacity with relatively low impact and clear intensity control.", ["Stationary Bike", "Outdoor Cycling"]),
  defineExercise("elliptical-trainer", "Elliptical Trainer", "Cardio", ["Quadriceps", "Glutes"], ["Hamstrings", "Calves"], "Steady-state cardio", "Low-impact option that keeps heart rate up without repetitive running impact.", ["Elliptical"]),
  defineExercise("jump-rope", "Jump Rope", "Cardio", ["Calves"], ["Shoulders", "Forearms"], "Plyometric conditioning", "Develops conditioning, rhythm, and foot speed with minimal equipment.", ["Skipping Rope"]),
  defineExercise("rowing-machine", "Rowing Machine", "Cardio", ["Lats", "Legs"], ["Core", "Biceps"], "Full-body cardio", "Builds conditioning with a strong full-body pull and leg drive pattern.", ["Erg Row", "Row Erg"]),
  defineExercise("running-outdoor", "Running (Outdoor)", "Cardio", ["Quadriceps", "Glutes"], ["Calves", "Hamstrings"], "Steady-state cardio", "Improves aerobic fitness with natural terrain and pace variability.", ["Outdoor Run"]),
  defineExercise("running-treadmill", "Running (Treadmill)", "Cardio", ["Quadriceps", "Glutes"], ["Calves", "Hamstrings"], "Steady-state cardio", "Makes pace and incline easy to control for conditioning sessions.", ["Treadmill Run"]),
  defineExercise("stair-climber", "Stair Climber", "Cardio", ["Glutes", "Quadriceps"], ["Calves"], "Steady-state cardio", "Creates a high-output cardio option with a strong lower-body demand.", ["Stair Stepper"]),
  defineExercise("stationary-bike", "Stationary Bike", "Cardio", ["Quadriceps"], ["Glutes", "Calves"], "Steady-state cardio", "Easy-to-dose conditioning tool for intervals or longer aerobic work.", ["Exercise Bike", "Spin Bike"]),
  defineExercise("swimming", "Swimming", "Cardio", ["Lats", "Shoulders"], ["Core", "Legs"], "Full-body cardio", "Provides full-body conditioning with very low impact on joints.", ["Lap Swimming"]),
  defineExercise("walking", "Walking", "Cardio", ["Calves", "Quadriceps"], ["Glutes"], "Low-intensity cardio", "Reliable low-intensity activity for recovery, calorie burn, and consistency.", ["Brisk Walking"]),

  defineExercise("cable-crossover", "Cable Crossover", "Chest", ["Pectoralis major"], ["Anterior delts"], "Horizontal adduction", "Keeps tension on the chest through the shortened range and lets line of pull be adjusted.", ["Cable Fly", "Standing Cable Fly"]),
  defineExercise("decline-barbell-bench-press", "Decline Barbell Bench Press", "Chest", ["Lower pectoralis major"], ["Triceps", "Anterior delts"], "Horizontal press", "Biases the lower chest with a strong pressing pattern and stable setup.", ["Decline Bench Press"]),
  defineExercise("flat-barbell-bench-press", "Flat Barbell Bench Press", "Chest", ["Pectoralis major"], ["Triceps", "Anterior delts"], "Horizontal press", "Core chest strength builder that allows repeatable loading and progression.", ["Barbell Bench Press"]),
  defineExercise("flat-dumbbell-bench-press", "Flat Dumbbell Bench Press", "Chest", ["Pectoralis major"], ["Triceps", "Anterior delts"], "Horizontal press", "Allows a freer pressing path and unilateral loading compared with the barbell.", ["Dumbbell Bench Press"]),
  defineExercise("flat-dumbbell-fly", "Flat Dumbbell Fly", "Chest", ["Pectoralis major"], ["Anterior delts"], "Horizontal adduction", "Emphasizes chest stretch and adduction with less triceps involvement.", ["Dumbbell Fly"]),
  defineExercise("incline-barbell-bench-press", "Incline Barbell Bench Press", "Chest", ["Upper pectoralis major"], ["Anterior delts", "Triceps"], "Incline press", "Biases the clavicular pec fibers while staying easy to load progressively.", ["Incline Bench Press"]),
  defineExercise("incline-dumbbell-bench-press", "Incline Dumbbell Bench Press", "Chest", ["Upper pectoralis major"], ["Anterior delts", "Triceps"], "Incline press", "Gives the upper chest a large range of motion with freer shoulder mechanics.", ["Incline Dumbbell Press"]),
  defineExercise("machine-chest-press", "Machine Chest Press", "Chest", ["Pectoralis major"], ["Triceps", "Anterior delts"], "Horizontal press", "Stable pressing option that lets the chest work hard with less balance demand.", ["Chest Press Machine"]),
  defineExercise("pec-deck-fly", "Pec Deck Fly", "Chest", ["Pectoralis major"], ["Anterior delts"], "Horizontal adduction", "Direct chest isolation with high stability and an easy shortened-range squeeze.", ["Seated Machine Fly", "Butterfly Machine"]),
  defineExercise("push-up", "Push-Up", "Chest", ["Pectoralis major"], ["Triceps", "Anterior delts", "Core"], "Horizontal press", "Bodyweight chest press that also trains trunk stiffness and scapular control.", ["Press-Up"]),

  defineExercise("behind-the-back-wrist-curl", "Behind-the-Back Wrist Curl", "Forearms", ["Forearm flexors"], ["Brachioradialis"], "Wrist flexion", "Directly overloads wrist flexion with a simple barbell setup.", ["Behind The Back Forearm Curl"]),
  defineExercise("farmers-carry", "Farmer's Carry", "Forearms", ["Forearm flexors", "Grip"], ["Upper traps", "Core"], "Loaded carry", "Builds grip endurance and whole-arm stability under load.", ["Loaded Carry", "Farmer Walk"]),
  defineExercise("reverse-curl", "Reverse Curl", "Forearms", ["Brachioradialis"], ["Biceps brachii", "Forearm extensors"], "Pronated elbow flexion", "Biases the brachioradialis and upper forearm with a pronated grip.", ["Barbell Reverse Curl"]),
  defineExercise("wrist-extension-dumbbell", "Wrist Extension (Dumbbell)", "Forearms", ["Forearm extensors"], ["Brachioradialis"], "Wrist extension", "Isolates the wrist extensors to improve forearm balance and elbow resilience.", ["Sitting Wrist Extension With Dumbbells"]),
  defineExercise("wrist-extension-ez-bar", "Wrist Extension (EZ Bar)", "Forearms", ["Forearm extensors"], ["Brachioradialis"], "Wrist extension", "Stable forearm-extensor builder with easy incremental loading.", ["Sitting Wrist Extension With EZ Bar"]),
  defineExercise("wrist-curl-dumbbell", "Wrist Curl (Dumbbell)", "Forearms", ["Forearm flexors"], ["Grip"], "Wrist flexion", "Directly targets the forearm flexors through a full curling motion at the wrist.", ["Forearm Curl (Dumbbell)"]),
  defineExercise("wrist-roller", "Wrist Roller", "Forearms", ["Forearm flexors", "Forearm extensors"], ["Delts"], "Grip rotation", "Builds dense forearm endurance and rotational control through long time under tension.", ["Forearm Roller"]),
  defineExercise("wrist-twist", "Wrist Twist", "Forearms", ["Pronators", "Supinators"], ["Forearm flexors"], "Forearm rotation", "Targets the muscles that rotate the forearm and stabilize the wrist.", ["Forearm Twist"]),

  defineExercise("abduction-machine", "Abduction Machine", "Legs", ["Glute medius"], ["Tensor fasciae latae"], "Hip abduction", "Targets the hip abductors to support pelvic stability and knee tracking.", ["Hip Abduction Machine"]),
  defineExercise("adduction-machine", "Adduction Machine", "Legs", ["Adductors"], ["Glute max"], "Hip adduction", "Direct adductor work that supports squat depth and lower-body stability.", ["Hip Adduction Machine"]),
  defineExercise("back-squat", "Back Squat", "Legs", ["Quadriceps", "Glutes"], ["Adductors", "Spinal erectors"], "Squat", "Classic lower-body strength builder that loads quads and glutes heavily.", ["Barbell Squat"]),
  defineExercise("barbell-glute-bridge", "Barbell Glute Bridge", "Legs", ["Glutes"], ["Hamstrings"], "Hip extension", "Direct glute-focused hip extension with reduced range compared with a hip thrust.", ["Glute Bridge"]),
  defineExercise("bulgarian-split-squat", "Bulgarian Split Squat", "Legs", ["Quadriceps", "Glutes"], ["Adductors"], "Unilateral squat", "Builds leg strength, balance, and hip stability one side at a time.", ["Rear-Foot Elevated Split Squat"]),
  defineExercise("front-squat", "Front Squat", "Legs", ["Quadriceps"], ["Glutes", "Upper back"], "Squat", "Biases the quads and upright torso more than a back squat.", ["Barbell Front Squat"]),
  defineExercise("leg-curl", "Leg Curl", "Legs", ["Hamstrings"], ["Calves"], "Knee flexion", "Isolates knee-flexion strength in the hamstrings.", ["Lying Leg Curl", "Seated Leg Curl"]),
  defineExercise("leg-extension", "Leg Extension", "Legs", ["Quadriceps"], [], "Knee extension", "Pure quad isolation that is easy to load and track.", ["Leg Extension Machine"]),
  defineExercise("leg-press", "Leg Press", "Legs", ["Quadriceps", "Glutes"], ["Hamstrings"], "Press", "Lets the legs work hard with high stability and manageable spinal loading.", ["45-Degree Leg Press"]),
  defineExercise("romanian-deadlift", "Romanian Deadlift", "Legs", ["Hamstrings", "Glutes"], ["Spinal erectors", "Adductors"], "Hip hinge", "Builds eccentric hamstring strength and loaded hip-extension control.", ["RDL"]),
  defineExercise("seated-calf-raise", "Seated Calf Raise", "Legs", ["Soleus"], ["Gastrocnemius"], "Ankle plantarflexion", "Biases the soleus because the knees are bent during the raise.", ["Seated Calf Raise Machine"]),
  defineExercise("standing-calf-raise", "Standing Calf Raise", "Legs", ["Gastrocnemius"], ["Soleus"], "Ankle plantarflexion", "Loads the calf through a long range with the knees extended.", ["Donkey Calf Raise"]),

  defineExercise("arnold-press", "Arnold Press", "Shoulders", ["Anterior delts", "Medial delts"], ["Triceps"], "Overhead press", "Trains the delts through a large pressing arc with rotation.", ["Dumbbell Arnold Press"]),
  defineExercise("cable-face-pull", "Cable Face Pull", "Shoulders", ["Rear delts", "External rotators"], ["Mid traps", "Rhomboids"], "Scapular retraction", "Builds rear-delt and upper-back balance while training external rotation.", ["Face Pull"]),
  defineExercise("cable-lateral-raise", "Cable Lateral Raise", "Shoulders", ["Medial delts"], ["Upper traps"], "Shoulder abduction", "Keeps tension on the side delts through the whole raise.", ["Cable Lateral Raise - For Mid Delt"]),
  defineExercise("front-raise", "Front Raise", "Shoulders", ["Anterior delts"], ["Upper chest"], "Shoulder flexion", "Directly biases the front delts through shoulder flexion.", ["Dumbbell Front Raise"]),
  defineExercise("landmine-press", "Landmine Press", "Shoulders", ["Anterior delts"], ["Upper chest", "Triceps"], "Angled press", "Shoulder-friendly pressing variation that still trains upward pressing strength.", ["One-Arm Landmine Press"]),
  defineExercise("lateral-raise", "Lateral Raise", "Shoulders", ["Medial delts"], ["Upper traps"], "Shoulder abduction", "Simple delt-builder that directly targets shoulder width.", ["Dumbbell Lateral Raise"]),
  defineExercise("overhead-press", "Overhead Press", "Shoulders", ["Anterior delts", "Medial delts"], ["Triceps", "Upper traps"], "Vertical press", "Foundational shoulder strength movement with clear progression.", ["Standing Overhead Press", "Barbell Shoulder Press"]),
  defineExercise("rear-delt-raise", "Rear Delt Raise", "Shoulders", ["Rear delts"], ["Rhomboids", "Mid traps"], "Horizontal abduction", "Directly loads the rear delts to balance pressing-heavy plans.", ["Rear Delt Dumbbell Raise"]),
  defineExercise("reverse-pec-deck", "Reverse Pec Deck", "Shoulders", ["Rear delts"], ["Mid traps", "Rhomboids"], "Horizontal abduction", "Stable rear-delt machine movement that is easy to perform strictly.", ["Rear Delt Machine Fly"]),
  defineExercise("seated-dumbbell-press", "Seated Dumbbell Press", "Shoulders", ["Anterior delts", "Medial delts"], ["Triceps"], "Vertical press", "Stable dumbbell press that lets each shoulder move independently.", ["Dumbbell Shoulder Press"]),

  defineExercise("cable-overhead-triceps-extension", "Cable Overhead Triceps Extension", "Triceps", ["Triceps long head"], ["Lateral head", "Medial head"], "Elbow extension", "Biases the long head strongly because the shoulder stays flexed overhead.", ["Overhead Rope Extension"]),
  defineExercise("close-grip-barbell-bench-press", "Close-Grip Barbell Bench Press", "Triceps", ["Triceps"], ["Chest", "Anterior delts"], "Press", "Heavy compound press that strongly involves the triceps through lockout.", ["Close Grip Bench Press"]),
  defineExercise("dumbbell-overhead-triceps-extension", "Dumbbell Overhead Triceps Extension", "Triceps", ["Triceps long head"], ["Lateral head"], "Elbow extension", "Loads the long head with a deep overhead stretch.", ["Overhead Dumbbell Extension"]),
  defineExercise("ez-bar-skullcrusher", "EZ-Bar Skullcrusher", "Triceps", ["Triceps long head", "Lateral head"], ["Medial head"], "Elbow extension", "Direct triceps builder that allows substantial loading in a lying setup.", ["EZ-Bar Lying Triceps Extension", "Skullcrusher"]),
  defineExercise("lying-triceps-extension", "Lying Triceps Extension", "Triceps", ["Triceps"], ["Shoulders"], "Elbow extension", "Classic free-weight isolation movement for all three triceps heads.", ["French Press"]),
  defineExercise("parallel-bar-dip", "Parallel Bar Dip", "Triceps", ["Triceps"], ["Chest", "Anterior delts"], "Press", "Bodyweight press that can heavily load the triceps when kept upright.", ["Triceps Dip"]),
  defineExercise("rope-pushdown", "Rope Pushdown", "Triceps", ["Triceps lateral head", "Triceps medial head"], ["Long head"], "Elbow extension", "Easy-to-control cable isolation movement with strong lockout tension.", ["Rope Push Down"]),
  defineExercise("triceps-kickback", "Triceps Kickback", "Triceps", ["Triceps"], [], "Elbow extension", "Shortened-range isolation move that keeps tension near lockout.", ["Dumbbell Kickback"]),
  defineExercise("triceps-extension-machine", "Triceps Extension Machine", "Triceps", ["Triceps"], [], "Elbow extension", "Stable machine-based triceps isolation that is easy to progress and control.", ["Triceps Extensions (Machine)"]),
  defineExercise("v-bar-pushdown", "V-Bar Pushdown", "Triceps", ["Triceps lateral head", "Triceps medial head"], ["Long head"], "Elbow extension", "Pushdown variation with a fixed grip that feels strong and stable for heavier work.", ["V-Bar Push Down"])
].sort((left, right) => {
  const categoryDiff = exerciseCategoryOrder.indexOf(left.category) - exerciseCategoryOrder.indexOf(right.category);
  if (categoryDiff !== 0) {
    return categoryDiff;
  }
  return left.name.localeCompare(right.name);
});
