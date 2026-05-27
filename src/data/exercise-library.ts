import { ExerciseCategory, ExerciseDefinition, ExerciseMuscleTarget } from "@/types/domain";
import { lyftaExerciseLibrary } from "@/data/exercise-library-lyfta.generated";

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

const curatedExerciseLibrary: ExerciseDefinition[] = [
  defineExercise("ab-wheel-rollout", "Ab Wheel Rollout", "Abs", ["Rectus abdominis", "Transverse abdominis"], ["Obliques", "Lats"], "Anti-extension", "Builds high-tension core bracing and teaches the torso to resist spinal extension.", ["Stability Ball Rollout", "Body Saw"], ["Ab-Wheel Rollout"]),
  defineExercise("bicycle-crunch", "Bicycle Crunch", "Abs", ["Obliques", "Rectus abdominis"], ["Hip flexors"], "Rotation", "Alternating cross-body crunch that hits obliques through rotation and the abs through trunk flexion simultaneously.", ["Russian Twist", "Cross-Body Mountain Climber"], ["Bicycle"]),
  defineExercise("cable-crunch", "Cable Crunch", "Abs", ["Rectus abdominis"], ["Obliques"], "Spinal flexion", "Loads trunk flexion directly so the abs can be trained through a strong shortened range.", ["Crunch Machine", "Decline Crunch"]),
  defineExercise("cable-wood-chop", "Cable Wood Chop", "Abs", ["Obliques"], ["Rectus abdominis", "Transverse abdominis"], "Rotation", "Diagonal cable pull across the body trains rotational power and oblique strength under resistance.", ["Medicine Ball Slam", "Russian Twist"], ["Woodchop", "Cable Woodchop"]),
  defineExercise("crunch", "Crunch", "Abs", ["Rectus abdominis"], ["Obliques"], "Spinal flexion", "Simple trunk-flexion movement that biases the upper abs with minimal setup.", ["Decline Crunch", "Machine Crunch"], ["Sit-Up Crunch"]),
  defineExercise("dead-bug", "Dead Bug", "Abs", ["Transverse abdominis", "Rectus abdominis"], ["Hip flexors", "Obliques"], "Anti-extension", "Teaches deep core bracing while limbs move independently — trains stability without spinal flexion.", ["Bird Dog", "Hollow Body Hold"]),
  defineExercise("decline-sit-up", "Decline Sit-Up", "Abs", ["Rectus abdominis"], ["Hip flexors"], "Spinal flexion", "Adds gravity load to the sit-up by increasing the angle, making the abs work through a longer range.", ["Weighted Crunch", "Machine Crunch"], ["Decline Sit-up"]),
  defineExercise("dragon-flag", "Dragon Flag", "Abs", ["Rectus abdominis", "Transverse abdominis"], ["Lats", "Hip flexors"], "Anti-extension", "Demands full-body tension and extreme trunk control through the lowering phase.", ["Hollow Body Hold", "Toes-to-Bar"]),
  defineExercise("flutter-kicks", "Flutter Kicks", "Abs", ["Lower rectus abdominis", "Hip flexors"], ["Transverse abdominis"], "Hip flexion", "Continuous alternating leg kicks build lower-ab endurance and hip flexor control under sustained tension.", ["Scissor Kicks", "Leg Raise Hold"]),
  defineExercise("hanging-knee-raise", "Hanging Knee Raise", "Abs", ["Lower rectus abdominis"], ["Hip flexors", "Obliques"], "Hip flexion", "Builds lower-ab control while teaching pelvic tilt under load.", ["Captain's Chair Knee Raise", "Reverse Crunch"]),
  defineExercise("hanging-leg-raise", "Hanging Leg Raise", "Abs", ["Rectus abdominis"], ["Hip flexors", "Obliques"], "Hip flexion", "Adds a longer lever than knee raises so the abs must create more posterior pelvic tilt.", ["Toes-to-Bar", "Supine Leg Raise"]),
  defineExercise("hollow-body-hold", "Hollow Body Hold", "Abs", ["Transverse abdominis", "Rectus abdominis"], ["Obliques", "Hip flexors"], "Anti-extension", "Full-body compression drill that teaches core tension from the gymnastics foundation — transfers to every lift.", ["Dead Bug", "Plank"], ["Hollow Hold"]),
  defineExercise("mountain-climber", "Mountain Climbers", "Abs", ["Transverse abdominis", "Obliques"], ["Hip flexors", "Rectus abdominis"], "Anti-extension", "Fast alternating knee drives build core stability and cardiovascular demand simultaneously.", ["Cross-Body Mountain Climber", "Plank"], ["Mountain Climber"]),
  defineExercise("pallof-press", "Pallof Press", "Abs", ["Transverse abdominis", "Obliques"], ["Glutes", "Rectus abdominis"], "Anti-rotation", "Cable anti-rotation press that trains the core to resist twisting force — highly functional for all athletic movements.", ["Half-Kneeling Pallof Press", "Banded Pallof Press"]),
  defineExercise("plank", "Plank", "Abs", ["Transverse abdominis"], ["Rectus abdominis", "Obliques"], "Anti-extension", "Trains full-core stiffness and bracing without spinal movement.", ["RKC Plank", "Body Saw"], ["Front Plank"]),
  defineExercise("russian-twist", "Russian Twist", "Abs", ["Obliques"], ["Rectus abdominis", "Hip flexors"], "Rotation", "Builds rotational control and oblique endurance through repeated trunk turning.", ["Cable Wood Chop", "Rotary Torso"]),
  defineExercise("side-plank", "Side Plank", "Abs", ["Obliques", "Quadratus lumborum"], ["Glute medius"], "Anti-lateral flexion", "Trains side-core stiffness that carries into squats, carries, and unilateral work.", ["Copenhagen Plank", "Suitcase Carry"]),
  defineExercise("sit-up", "Sit-Up", "Abs", ["Rectus abdominis", "Hip flexors"], ["Obliques"], "Spinal flexion", "Full range trunk flexion movement that trains the abs through a complete shortening contraction.", ["Decline Sit-Up", "Weighted Sit-Up"]),
  defineExercise("toes-to-bar", "Toes-to-Bar", "Abs", ["Rectus abdominis", "Hip flexors"], ["Obliques", "Lats"], "Hip flexion", "Hanging movement demanding both grip endurance and powerful hip flexion to bring feet to the bar.", ["Hanging Leg Raise", "Knees-to-Elbows"], ["Hanging Toes to Bar"]),
  defineExercise("v-up", "V-Up", "Abs", ["Rectus abdominis"], ["Hip flexors"], "Spinal flexion", "Challenges the abs through combined trunk and hip flexion with a long lever.", ["Toe Touch Crunch", "Hollow Rock"]),
  defineExercise("windshield-wiper", "Windshield Wipers", "Abs", ["Obliques", "Transverse abdominis"], ["Rectus abdominis", "Hip flexors"], "Rotation", "Hanging or floor leg rotation that demands extreme oblique control through a wide arc.", ["Russian Twist", "Cable Wood Chop"], ["Wipers"]),

  defineExercise("back-extension", "Back Extension", "Back", ["Spinal erectors"], ["Glutes", "Hamstrings"], "Hip hinge", "Strengthens the spinal erectors and teaches controlled hip extension.", ["45-Degree Back Extension", "Reverse Hyper"]),
  defineExercise("barbell-row", "Barbell Row", "Back", ["Lats", "Mid traps", "Rhomboids"], ["Rear delts", "Biceps", "Spinal erectors"], "Horizontal pull", "Builds upper-back thickness and loaded pulling strength.", ["Chest-Supported Row", "Cable Row"], ["Bent-Over Row"]),
  defineExercise("barbell-shrug", "Barbell Shrug", "Back", ["Upper traps"], ["Forearms"], "Scapular elevation", "Directly overloads the upper traps with simple progressive loading.", ["Dumbbell Shrug", "Machine Shrug"]),
  defineExercise("cable-row", "Cable Row", "Back", ["Lats", "Rhomboids"], ["Biceps", "Rear delts"], "Horizontal pull", "Gives a stable rowing pattern with smooth resistance and easy load changes.", ["Seated Cable Row", "Machine Row"]),
  defineExercise("cable-pull-through", "Cable Pull-Through", "Back", ["Glutes", "Hamstrings"], ["Spinal erectors"], "Hip hinge", "Low-cable hip hinge that teaches proper posterior chain loading with lighter loads than deadlifts.", ["Romanian Deadlift", "Good Morning"], ["Cable Pull Through"]),
  defineExercise("chest-supported-row", "Chest-Supported Row", "Back", ["Rhomboids", "Mid traps", "Lats"], ["Rear delts", "Biceps"], "Horizontal pull", "Chest pad removes spinal stability demand so the upper back can be isolated without lower-back fatigue.", ["Dumbbell Row", "Cable Row"], ["Chest-Supported Dumbbell Row"]),
  defineExercise("chin-up", "Chin-Up", "Back", ["Lats"], ["Biceps", "Lower traps"], "Vertical pull", "Combines strong lat loading with arm involvement and useful bodyweight strength.", ["Neutral-Grip Pull-Up", "Lat Pulldown"]),
  defineExercise("deadlift", "Deadlift", "Back", ["Spinal erectors", "Lats"], ["Glutes", "Hamstrings", "Forearms"], "Hip hinge", "Builds total posterior-chain and upper-back strength while teaching whole-body tension.", ["Trap Bar Deadlift", "Rack Pull"], ["Conventional Deadlift"]),
  defineExercise("dumbbell-row", "Dumbbell Row", "Back", ["Lats", "Rhomboids"], ["Biceps", "Rear delts"], "Horizontal pull", "Lets each side row through a long range of motion with a stable torso setup.", ["One-Arm Row", "Chest-Supported Dumbbell Row"], ["One-Arm Dumbbell Row"]),
  defineExercise("dumbbell-pullover", "Dumbbell Pullover", "Back", ["Lats", "Teres major"], ["Triceps", "Chest", "Rear delts"], "Shoulder extension", "Classic chest/back cross-over movement that stretches the lats under load through a long arc of motion.", ["Cable Pullover", "Straight-Arm Pulldown"]),
  defineExercise("good-morning", "Good Morning", "Back", ["Spinal erectors", "Hamstrings"], ["Glutes"], "Hip hinge", "Barbell hinge movement that directly loads the spinal erectors and hamstrings through a forward lean.", ["Romanian Deadlift", "Back Extension"]),
  defineExercise("inverted-row", "Inverted Row", "Back", ["Rhomboids", "Mid traps", "Lats"], ["Biceps", "Rear delts"], "Horizontal pull", "Bodyweight horizontal row with adjustable difficulty — bridges the gap between machine rows and barbell rows.", ["Barbell Row", "TRX Row"]),
  defineExercise("lat-pulldown", "Lat Pulldown", "Back", ["Lats"], ["Biceps", "Teres major"], "Vertical pull", "Makes vertical pulling scalable and easy to progress when pull-ups are not ready yet.", ["Pull-Up", "Assisted Pull-Up"]),
  defineExercise("meadows-row", "Meadows Row", "Back", ["Lats", "Teres major"], ["Biceps", "Rear delts"], "Horizontal pull", "Landmine unilateral row with a strong stretch at the bottom that hammers the lats with heavy loading.", ["Dumbbell Row", "Single-Arm Cable Row"]),
  defineExercise("pendlay-row", "Pendlay Row", "Back", ["Lats", "Mid traps", "Rhomboids", "Spinal erectors"], ["Biceps", "Rear delts"], "Horizontal pull", "Dead-stop barbell row from the floor with a horizontal back — removes momentum and maximizes back engagement.", ["Barbell Row", "Dumbbell Row"], ["Barbell Pendlay Row"]),
  defineExercise("pull-up", "Pull-Up", "Back", ["Lats", "Lower traps"], ["Biceps", "Rear delts", "Teres major"], "Vertical pull", "Gold-standard bodyweight pulling strength — builds lat width and grip strength with no equipment.", ["Lat Pulldown", "Assisted Pull-Up"], ["Overhand Pull-Up", "Pull-up"]),
  defineExercise("rack-pull", "Rack Pull", "Back", ["Upper back", "Spinal erectors"], ["Glutes", "Hamstrings", "Forearms"], "Hip hinge", "Overloads the lockout and upper-back portion of the deadlift pattern.", ["Block Pull", "Deadlift from Pins"]),
  defineExercise("straight-arm-pulldown", "Straight-Arm Pulldown", "Back", ["Lats", "Teres major"], ["Triceps", "Rear delts"], "Vertical pull", "Isolates the lats in the stretched position with arms straight — excellent pre-exhaust or accessory movement.", ["Cable Pullover", "Lat Pulldown"], ["Straight Arm Pulldown", "Cable Straight Arm Pulldown"]),
  defineExercise("sumo-deadlift", "Sumo Deadlift", "Back", ["Spinal erectors", "Lats"], ["Glutes", "Quads", "Hamstrings", "Forearms"], "Hip hinge", "Wide-stance deadlift that reduces torso lean and emphasizes the hips and quads compared to conventional.", ["Conventional Deadlift", "Trap Bar Deadlift"]),
  defineExercise("t-bar-row", "T-Bar Row", "Back", ["Lats", "Mid back"], ["Biceps", "Rear delts"], "Horizontal pull", "Allows heavy rowing with a fixed path that strongly biases mid-back thickness.", ["Landmine Row", "Chest-Supported T-Bar Row"]),
  defineExercise("trap-bar-deadlift", "Trap Bar Deadlift", "Back", ["Spinal erectors", "Glutes", "Quads"], ["Hamstrings", "Lats", "Forearms"], "Hip hinge", "Neutral-grip deadlift variation that reduces lumbar stress and allows more quad involvement for most lifters.", ["Barbell Deadlift", "Leg Press"], ["Hex Bar Deadlift"]),
  defineExercise("assisted-pull-up", "Assisted Pull-Up", "Back", ["Lats"], ["Biceps", "Teres major"], "Vertical pull", "Machine-counterweighted pull-up that lets beginners train vertical pulling at a manageable load.", ["Lat Pulldown", "Pull-Up"], ["Assisted Pull-up"]),

  defineExercise("alternating-dumbbell-curl", "Alternating Dumbbell Curl", "Biceps", ["Biceps"], ["Forearms", "Brachialis"], "Elbow flexion", "Allows each arm to supinate and curl independently so form can be focused on one side at a time.", ["Dumbbell Curl", "Hammer Curl"], ["Alternate Biceps Curl"]),
  defineExercise("bayesian-curl", "Bayesian Curl", "Biceps", ["Biceps", "Brachialis"], ["Forearms"], "Elbow flexion", "Behind-the-body cable curl that loads the long head of the biceps in its most stretched position.", ["Incline Dumbbell Curl", "Cable Curl"], ["Cable Behind-Body Curl"]),
  defineExercise("barbell-curl", "Barbell Curl", "Biceps", ["Biceps brachii"], ["Brachialis", "Forearms"], "Elbow flexion", "Classic bilateral curl that loads the biceps heavily through the mid-range.", ["EZ-Bar Curl", "Cable Curl"]),
  defineExercise("cable-hammer-curl", "Cable Hammer Curl", "Biceps", ["Brachialis", "Brachioradialis"], ["Biceps"], "Elbow flexion", "Neutral-grip cable curl that emphasizes the brachialis and brachioradialis for arm thickness.", ["Hammer Curl", "Rope Curl"]),
  defineExercise("cable-curl", "Cable Curl", "Biceps", ["Biceps brachii"], ["Brachialis"], "Elbow flexion", "Keeps constant tension on the elbow flexors through the whole rep.", ["Standing Cable Curl", "Bayesian Curl"]),
  defineExercise("concentration-curl", "Concentration Curl", "Biceps", ["Biceps brachii"], ["Brachialis"], "Elbow flexion", "Reduces momentum and isolates elbow flexion in a shortened range.", ["Spider Curl", "Preacher Curl"]),
  defineExercise("cross-body-hammer-curl", "Cross-Body Hammer Curl", "Biceps", ["Brachialis", "Brachioradialis"], ["Biceps"], "Elbow flexion", "Hammer curl variation that pulls the dumbbell across the body, emphasizing brachialis peak contraction.", ["Hammer Curl", "Cable Hammer Curl"], ["Cross Body Hammer Curl", "Dumbbell Cross Body Hammer Curl"]),
  defineExercise("drag-curl", "Drag Curl", "Biceps", ["Biceps"], ["Forearms", "Brachialis"], "Elbow flexion", "Barbell dragged up the torso instead of arcing out — keeps constant tension on the biceps short head.", ["Barbell Curl", "Concentration Curl"]),
  defineExercise("dumbbell-curl", "Dumbbell Curl", "Biceps", ["Biceps brachii"], ["Forearms"], "Elbow flexion", "Simple unilateral curl that lets both arms supinate freely.", ["Alternating Dumbbell Curl", "Cable Curl"]),
  defineExercise("ez-bar-curl", "EZ-Bar Curl", "Biceps", ["Biceps brachii"], ["Brachialis", "Forearms"], "Elbow flexion", "Uses a friendlier wrist position than a straight bar while still allowing heavy loading.", ["Barbell Curl", "Preacher Curl"]),
  defineExercise("hammer-curl", "Hammer Curl", "Biceps", ["Brachialis", "Brachioradialis"], ["Biceps brachii"], "Neutral-grip elbow flexion", "Biases the brachialis and brachioradialis to build arm thickness and grip carryover.", ["Dumbbell Hammer Curl", "Rope Hammer Curl"]),
  defineExercise("incline-dumbbell-curl", "Incline Dumbbell Curl", "Biceps", ["Biceps brachii"], ["Brachialis"], "Elbow flexion", "Lengthens the biceps at the shoulder for a strong stretch-mediated stimulus.", ["Seated Incline Dumbbell Curl", "Bayesian Curl"]),
  defineExercise("machine-curl", "Machine Curl", "Biceps", ["Biceps"], ["Brachialis", "Forearms"], "Elbow flexion", "Preacher or arm-curl machine that provides stable resistance and eliminates swing for pure biceps isolation.", ["Preacher Curl", "Cable Curl"], ["Seated Machine Curl", "Machine Biceps Curl"]),
  defineExercise("preacher-curl", "Preacher Curl", "Biceps", ["Biceps brachii"], ["Brachialis"], "Elbow flexion", "Locks the upper arm in place to limit cheating and hit the bottom range hard.", ["EZ-Bar Preacher Curl", "Machine Preacher Curl"]),
  defineExercise("prone-incline-curl", "Prone Incline Curl", "Biceps", ["Biceps"], ["Brachialis", "Forearms"], "Elbow flexion", "Chest-down on incline bench curl that stretches the biceps long head throughout the entire range.", ["Incline Dumbbell Curl", "Bayesian Curl"], ["Dumbbell Prone Incline Curl", "Barbell Prone Incline Curl"]),
  defineExercise("spider-curl", "Spider Curl", "Biceps", ["Biceps brachii"], ["Brachialis"], "Elbow flexion", "Biases the shortened position of the curl with strict upper-arm positioning.", ["Concentration Curl", "Preacher Curl"]),
  defineExercise("zottman-curl", "Zottman Curl", "Biceps", ["Biceps brachii", "Brachioradialis"], ["Forearm extensors"], "Supination/pronation curl", "Trains biceps on the way up and forearms on the controlled lowering phase.", ["Zottman Bicep Curl With Dumbbells"]),

  defineExercise("assault-bike", "Assault Bike", "Cardio", [], [], "Full body", "Fan-resistance bike using both arms and legs — builds cardiovascular capacity and muscular endurance simultaneously.", ["Stationary Bike", "Rowing Machine"], ["Air Bike"]),
  defineExercise("battle-ropes", "Battle Ropes", "Cardio", [], [], "Full body", "Alternating or simultaneous rope slams build power endurance and cardiovascular output with upper body emphasis.", ["Assault Bike", "Jump Rope"], ["Battling Ropes"]),
  defineExercise("box-jump", "Box Jump", "Cardio", [], [], "Plyometric", "Explosive lower-body jump onto a raised platform that trains power output and landing mechanics.", ["Squat Jump", "Step-Up"]),
  defineExercise("burpee", "Burpee", "Cardio", [], [], "Full body", "Squat-thrust-jump combination that demands cardiovascular output and full-body coordination under fatigue.", ["Squat Jump", "Mountain Climbers"]),
  defineExercise("cycling", "Cycling", "Cardio", ["Quadriceps", "Glutes"], ["Hamstrings", "Calves"], "Steady-state cardio", "Builds aerobic capacity with relatively low impact and clear intensity control.", ["Stationary Bike", "Outdoor Cycling"]),
  defineExercise("elliptical-trainer", "Elliptical Trainer", "Cardio", ["Quadriceps", "Glutes"], ["Hamstrings", "Calves"], "Steady-state cardio", "Low-impact option that keeps heart rate up without repetitive running impact.", ["Elliptical"]),
  defineExercise("jump-rope", "Jump Rope", "Cardio", ["Calves"], ["Shoulders", "Forearms"], "Plyometric conditioning", "Develops conditioning, rhythm, and foot speed with minimal equipment.", ["Skipping Rope"]),
  defineExercise("rowing-machine", "Rowing Machine", "Cardio", ["Lats", "Legs"], ["Core", "Biceps"], "Full-body cardio", "Builds conditioning with a strong full-body pull and leg drive pattern.", ["Erg Row", "Row Erg"]),
  defineExercise("running-outdoor", "Running (Outdoor)", "Cardio", ["Quadriceps", "Glutes"], ["Calves", "Hamstrings"], "Steady-state cardio", "Improves aerobic fitness with natural terrain and pace variability.", ["Outdoor Run"]),
  defineExercise("running-treadmill", "Running (Treadmill)", "Cardio", ["Quadriceps", "Glutes"], ["Calves", "Hamstrings"], "Steady-state cardio", "Makes pace and incline easy to control for conditioning sessions.", ["Treadmill Run"]),
  defineExercise("stair-climber", "Stair Climber", "Cardio", ["Glutes", "Quadriceps"], ["Calves"], "Steady-state cardio", "Creates a high-output cardio option with a strong lower-body demand.", ["Stair Stepper"]),
  defineExercise("stationary-bike", "Stationary Bike", "Cardio", ["Quadriceps"], ["Glutes", "Calves"], "Steady-state cardio", "Easy-to-dose conditioning tool for intervals or longer aerobic work.", ["Exercise Bike", "Spin Bike"]),
  defineExercise("sled-push", "Sled Push", "Cardio", [], [], "Full body", "Loaded horizontal push that builds work capacity and full-body conditioning without eccentric muscle damage.", ["Farmer's Carry", "Assault Bike"], ["Power Sled Push"]),
  defineExercise("swimming", "Swimming", "Cardio", ["Lats", "Shoulders"], ["Core", "Legs"], "Full-body cardio", "Provides full-body conditioning with very low impact on joints.", ["Lap Swimming"]),
  defineExercise("walking", "Walking", "Cardio", ["Calves", "Quadriceps"], ["Glutes"], "Low-intensity cardio", "Reliable low-intensity activity for recovery, calorie burn, and consistency.", ["Brisk Walking"]),

  defineExercise("cable-crossover", "Cable Crossover", "Chest", ["Pectoralis major"], ["Anterior delts"], "Horizontal adduction", "Keeps tension on the chest through the shortened range and lets line of pull be adjusted.", ["Cable Fly", "Standing Cable Fly"]),
  defineExercise("chest-dip", "Chest Dip", "Chest", ["Lower chest", "Chest"], ["Triceps", "Anterior delts"], "Horizontal push", "Forward-leaning dip that shifts load from triceps to the lower chest — a classic weighted pressing compound.", ["Decline Barbell Bench Press", "Parallel Bar Dip"]),
  defineExercise("decline-barbell-bench-press", "Decline Barbell Bench Press", "Chest", ["Lower pectoralis major"], ["Triceps", "Anterior delts"], "Horizontal press", "Biases the lower chest with a strong pressing pattern and stable setup.", ["Decline Bench Press"]),
  defineExercise("decline-dumbbell-fly", "Decline Dumbbell Fly", "Chest", ["Lower chest"], ["Anterior delts"], "Horizontal push", "Fly variation on a decline that stretches and loads the lower chest through an arc.", ["Flat Dumbbell Fly", "Pec Deck Fly"], ["Decline Fly"]),
  defineExercise("decline-dumbbell-press", "Decline Dumbbell Press", "Chest", ["Lower chest"], ["Triceps", "Anterior delts"], "Horizontal push", "Dumbbell pressing on a decline hits the lower chest through a wider range than the barbell version.", ["Decline Barbell Bench Press", "Chest Dip"], ["Decline Press"]),
  defineExercise("flat-barbell-bench-press", "Flat Barbell Bench Press", "Chest", ["Pectoralis major"], ["Triceps", "Anterior delts"], "Horizontal press", "Core chest strength builder that allows repeatable loading and progression.", ["Barbell Bench Press"]),
  defineExercise("flat-dumbbell-bench-press", "Flat Dumbbell Bench Press", "Chest", ["Pectoralis major"], ["Triceps", "Anterior delts"], "Horizontal press", "Allows a freer pressing path and unilateral loading compared with the barbell.", ["Dumbbell Bench Press"]),
  defineExercise("flat-dumbbell-fly", "Flat Dumbbell Fly", "Chest", ["Pectoralis major"], ["Anterior delts"], "Horizontal adduction", "Emphasizes chest stretch and adduction with less triceps involvement.", ["Dumbbell Fly"]),
  defineExercise("floor-press", "Floor Press", "Chest", ["Chest", "Triceps"], ["Anterior delts"], "Horizontal push", "Bench press from the floor that eliminates leg drive and limits range of motion — emphasizes lockout strength.", ["Close-Grip Barbell Bench Press", "Flat Barbell Bench Press"]),
  defineExercise("high-to-low-cable-fly", "High-to-Low Cable Fly", "Chest", ["Lower chest"], ["Chest", "Anterior delts"], "Horizontal push", "Cable fly from high anchor downward that mirrors the decline press arc with continuous tension.", ["Decline Dumbbell Fly", "Pec Deck Fly"]),
  defineExercise("incline-cable-fly", "Incline Cable Fly", "Chest", ["Upper chest"], ["Anterior delts"], "Horizontal push", "Low-to-high cable fly that keeps constant tension through the full arc and strongly targets the upper chest.", ["Incline Dumbbell Fly", "Cable Crossover"], ["Cable Incline Fly"]),
  defineExercise("incline-barbell-bench-press", "Incline Barbell Bench Press", "Chest", ["Upper pectoralis major"], ["Anterior delts", "Triceps"], "Incline press", "Biases the clavicular pec fibers while staying easy to load progressively.", ["Incline Bench Press"]),
  defineExercise("incline-dumbbell-bench-press", "Incline Dumbbell Bench Press", "Chest", ["Upper pectoralis major"], ["Anterior delts", "Triceps"], "Incline press", "Gives the upper chest a large range of motion with freer shoulder mechanics.", ["Incline Dumbbell Press"]),
  defineExercise("incline-dumbbell-fly", "Incline Dumbbell Fly", "Chest", ["Upper chest", "Anterior delts"], ["Chest"], "Horizontal push", "Fly on an incline that targets the clavicular head of the pec through a stretched arc under load.", ["Incline Cable Fly", "Pec Deck Fly"], ["Incline Fly"]),
  defineExercise("low-to-high-cable-fly", "Low-to-High Cable Fly", "Chest", ["Upper chest", "Anterior delts"], ["Chest"], "Horizontal push", "Cable fly from low anchor upward that maximizes upper chest activation through constant tension.", ["Incline Dumbbell Fly", "Incline Cable Fly"], ["Low Cable Fly"]),
  defineExercise("machine-chest-press", "Machine Chest Press", "Chest", ["Pectoralis major"], ["Triceps", "Anterior delts"], "Horizontal press", "Stable pressing option that lets the chest work hard with less balance demand.", ["Chest Press Machine"]),
  defineExercise("pec-deck-fly", "Pec Deck Fly", "Chest", ["Pectoralis major"], ["Anterior delts"], "Horizontal adduction", "Direct chest isolation with high stability and an easy shortened-range squeeze.", ["Seated Machine Fly", "Butterfly Machine"]),
  defineExercise("push-up", "Push-Up", "Chest", ["Pectoralis major"], ["Triceps", "Anterior delts", "Core"], "Horizontal press", "Bodyweight chest press that also trains trunk stiffness and scapular control.", ["Press-Up"]),
  defineExercise("svend-press", "Svend Press", "Chest", ["Chest"], ["Anterior delts", "Triceps"], "Horizontal push", "Plate-squeeze press that keeps constant inner chest tension through the entire movement.", ["Cable Crossover", "Pec Deck Fly"], ["Weighted Svend Press", "Dumbbell Svend Press"]),

  defineExercise("behind-the-back-wrist-curl", "Behind-the-Back Wrist Curl", "Forearms", ["Forearm flexors"], ["Brachioradialis"], "Wrist flexion", "Directly overloads wrist flexion with a simple barbell setup.", ["Behind The Back Forearm Curl"]),
  defineExercise("dead-hang", "Dead Hang", "Forearms", ["Forearms", "Grip"], ["Lats", "Biceps"], "Isometric", "Hanging from a bar builds passive grip strength and decompresses the spine under bodyweight load.", ["Bar Hang", "Towel Pull-Up"], ["Bar Hang"]),
  defineExercise("farmers-carry", "Farmer's Carry", "Forearms", ["Forearm flexors", "Grip"], ["Upper traps", "Core"], "Loaded carry", "Builds grip endurance and whole-arm stability under load.", ["Loaded Carry", "Farmer Walk"]),
  defineExercise("plate-pinch", "Plate Pinch", "Forearms", ["Forearms", "Grip"], [], "Isometric", "Pinching weight plates together builds pinch grip strength that transfers to all pulling movements.", ["Dead Hang", "Farmers Carry"]),
  defineExercise("reverse-curl", "Reverse Curl", "Forearms", ["Brachioradialis"], ["Biceps brachii", "Forearm extensors"], "Pronated elbow flexion", "Biases the brachioradialis and upper forearm with a pronated grip.", ["Barbell Reverse Curl"]),
  defineExercise("reverse-wrist-curl-barbell", "Reverse Wrist Curl (Barbell)", "Forearms", ["Brachioradialis", "Forearms"], ["Biceps"], "Wrist extension", "Barbell wrist curl with an overhand grip trains the extensor side of the forearm — balances flexor work.", ["Wrist Extension (Dumbbell)", "Reverse Curl"], ["Reverse Wrist Curl", "Barbell Reverse Wrist Curl"]),
  defineExercise("wrist-extension-dumbbell", "Wrist Extension (Dumbbell)", "Forearms", ["Forearm extensors"], ["Brachioradialis"], "Wrist extension", "Isolates the wrist extensors to improve forearm balance and elbow resilience.", ["Sitting Wrist Extension With Dumbbells"]),
  defineExercise("wrist-extension-ez-bar", "Wrist Extension (EZ Bar)", "Forearms", ["Forearm extensors"], ["Brachioradialis"], "Wrist extension", "Stable forearm-extensor builder with easy incremental loading.", ["Sitting Wrist Extension With EZ Bar"]),
  defineExercise("wrist-curl-dumbbell", "Wrist Curl (Dumbbell)", "Forearms", ["Forearm flexors"], ["Grip"], "Wrist flexion", "Directly targets the forearm flexors through a full curling motion at the wrist.", ["Forearm Curl (Dumbbell)"]),
  defineExercise("wrist-roller", "Wrist Roller", "Forearms", ["Forearm flexors", "Forearm extensors"], ["Delts"], "Grip rotation", "Builds dense forearm endurance and rotational control through long time under tension.", ["Forearm Roller"]),
  defineExercise("wrist-twist", "Wrist Twist", "Forearms", ["Pronators", "Supinators"], ["Forearm flexors"], "Forearm rotation", "Targets the muscles that rotate the forearm and stabilize the wrist.", ["Forearm Twist"]),

  defineExercise("abduction-machine", "Abduction Machine", "Legs", ["Glute medius"], ["Tensor fasciae latae"], "Hip abduction", "Targets the hip abductors to support pelvic stability and knee tracking.", ["Hip Abduction Machine"]),
  defineExercise("adduction-machine", "Adduction Machine", "Legs", ["Adductors"], ["Glute max"], "Hip adduction", "Direct adductor work that supports squat depth and lower-body stability.", ["Hip Adduction Machine"]),
  defineExercise("back-squat", "Back Squat", "Legs", ["Quadriceps", "Glutes"], ["Adductors", "Spinal erectors"], "Squat", "Classic lower-body strength builder that loads quads and glutes heavily.", ["Barbell Squat"]),
  defineExercise("barbell-hip-thrust", "Barbell Hip Thrust", "Legs", ["Glutes"], ["Hamstrings", "Quads"], "Hip extension", "Bench-supported barbell hip drive that maximally loads the glutes through a full range of hip extension — best glute builder.", ["Barbell Glute Bridge", "Cable Kickback"]),
  defineExercise("barbell-glute-bridge", "Barbell Glute Bridge", "Legs", ["Glutes"], ["Hamstrings"], "Hip extension", "Direct glute-focused hip extension with reduced range compared with a hip thrust.", ["Glute Bridge"]),
  defineExercise("bulgarian-split-squat", "Bulgarian Split Squat", "Legs", ["Quadriceps", "Glutes"], ["Adductors"], "Unilateral squat", "Builds leg strength, balance, and hip stability one side at a time.", ["Rear-Foot Elevated Split Squat"]),
  defineExercise("box-squat", "Box Squat", "Legs", ["Glutes", "Quads", "Hamstrings"], ["Core"], "Squat", "Squatting to a box removes the bounce reflex and teaches proper depth and hip-hinge squat mechanics.", ["Pause Squat", "Back Squat"]),
  defineExercise("calf-press-leg-press", "Calf Press (Leg Press)", "Legs", ["Gastrocnemius", "Soleus"], [], "Plantar flexion", "Calf raise done with legs extended on a leg press machine — allows heavy loading in a safe fixed path.", ["Standing Calf Raise", "Seated Calf Raise"], ["Leg Press Calf Raise", "Sled Calf Press On Leg Press"]),
  defineExercise("cable-kickback", "Cable Kickback", "Legs", ["Glutes"], ["Hamstrings"], "Hip extension", "Standing cable hip extension isolates the glute through a full range of motion with constant cable tension.", ["Hip Thrust", "Donkey Kick"], ["Cable kickback"]),
  defineExercise("dumbbell-lunge", "Dumbbell Lunge", "Legs", ["Quads", "Glutes"], ["Hamstrings"], "Single-leg", "Dumbbell-loaded forward lunge builds unilateral leg strength and hip stability simultaneously.", ["Bulgarian Split Squat", "Reverse Lunge"]),
  defineExercise("front-squat", "Front Squat", "Legs", ["Quadriceps"], ["Glutes", "Upper back"], "Squat", "Biases the quads and upright torso more than a back squat.", ["Barbell Front Squat"]),
  defineExercise("glute-ham-raise", "Glute-Ham Raise", "Legs", ["Hamstrings", "Glutes"], ["Spinal erectors", "Calves"], "Knee flexion", "GHR machine exercise that trains hamstrings through both hip extension and knee flexion simultaneously.", ["Nordic Curl", "Leg Curl"]),
  defineExercise("goblet-squat", "Goblet Squat", "Legs", ["Quads", "Glutes"], ["Core", "Hamstrings"], "Squat", "Front-loaded squat with a kettlebell or dumbbell held at the chest — teaches upright torso position and depth.", ["Front Squat", "Hack Squat"]),
  defineExercise("hack-squat", "Hack Squat", "Legs", ["Quads"], ["Glutes", "Hamstrings"], "Squat", "Machine squat with back supported that emphasizes the quads through a deep range with reduced spinal load.", ["Leg Press", "Back Squat"], ["Sled Hack Squat"]),
  defineExercise("leg-curl", "Leg Curl", "Legs", ["Hamstrings"], ["Calves"], "Knee flexion", "Isolates knee-flexion strength in the hamstrings.", ["Lying Leg Curl", "Seated Leg Curl"]),
  defineExercise("leg-extension", "Leg Extension", "Legs", ["Quadriceps"], [], "Knee extension", "Pure quad isolation that is easy to load and track.", ["Leg Extension Machine"]),
  defineExercise("leg-press", "Leg Press", "Legs", ["Quadriceps", "Glutes"], ["Hamstrings"], "Press", "Lets the legs work hard with high stability and manageable spinal loading.", ["45-Degree Leg Press"]),
  defineExercise("nordic-curl", "Nordic Curl", "Legs", ["Hamstrings"], ["Glutes", "Calves"], "Knee flexion", "Eccentric-dominant hamstring drill — feet anchored, body lowered toward floor — builds exceptional hamstring strength.", ["Leg Curl", "Romanian Deadlift"], ["Nordic Hamstring Curl"]),
  defineExercise("pause-squat", "Pause Squat", "Legs", ["Quads", "Glutes"], ["Hamstrings", "Core"], "Squat", "Squat with a 2-3 second pause in the hole that eliminates the stretch reflex and builds raw strength from the bottom.", ["Back Squat", "Box Squat"]),
  defineExercise("reverse-lunge", "Reverse Lunge", "Legs", ["Quads", "Glutes"], ["Hamstrings", "Hip flexors"], "Single-leg", "Stepping backward instead of forward reduces knee shear and allows more controlled loading than forward lunge.", ["Dumbbell Lunge", "Bulgarian Split Squat"]),
  defineExercise("romanian-deadlift", "Romanian Deadlift", "Legs", ["Hamstrings", "Glutes"], ["Spinal erectors", "Adductors"], "Hip hinge", "Builds eccentric hamstring strength and loaded hip-extension control.", ["RDL"]),
  defineExercise("seated-calf-raise", "Seated Calf Raise", "Legs", ["Soleus"], ["Gastrocnemius"], "Ankle plantarflexion", "Biases the soleus because the knees are bent during the raise.", ["Seated Calf Raise Machine"]),
  defineExercise("single-leg-press", "Single-Leg Press", "Legs", ["Quads", "Glutes"], ["Hamstrings"], "Single-leg", "Unilateral leg press that addresses imbalances and allows each leg to be loaded independently.", ["Leg Press", "Bulgarian Split Squat"], ["Single Leg Press", "Assisted Single Leg Press"]),
  defineExercise("smith-machine-squat", "Smith Machine Squat", "Legs", ["Quads", "Glutes"], ["Hamstrings", "Core"], "Squat", "Guided-bar squat on a Smith machine that removes balance demands — useful for high-volume leg work.", ["Hack Squat", "Back Squat"], ["Smith Squat"]),
  defineExercise("step-up", "Step-Up", "Legs", ["Quads", "Glutes"], ["Hamstrings", "Hip flexors"], "Single-leg", "Unilateral step onto an elevated surface builds functional leg strength and single-leg stability.", ["Reverse Lunge", "Bulgarian Split Squat"], ["Step-up"]),
  defineExercise("sumo-squat", "Sumo Squat", "Legs", ["Glutes", "Quads", "Adductors"], ["Hamstrings"], "Squat", "Wide-stance squat that biases the glutes and inner thighs compared to a standard shoulder-width squat.", ["Back Squat", "Goblet Squat"]),
  defineExercise("standing-calf-raise", "Standing Calf Raise", "Legs", ["Gastrocnemius"], ["Soleus"], "Ankle plantarflexion", "Loads the calf through a long range with the knees extended.", ["Donkey Calf Raise"]),
  defineExercise("tibialis-raise", "Tibialis Raise", "Legs", ["Tibialis anterior"], [], "Dorsiflexion", "Wall or slant-board toe raise that directly trains the shin muscle — critical for shin splint prevention and ankle stability.", ["Seated Tibialis Raise", "Band Dorsiflexion"], ["Tibialis Anterior Raise", "Shin Raise"]),
  defineExercise("walking-lunge", "Walking Lunge", "Legs", ["Quads", "Glutes"], ["Hamstrings", "Hip flexors"], "Single-leg", "Continuous forward lunges build leg endurance, balance, and hypertrophy across the full range of leg extension.", ["Dumbbell Lunge", "Reverse Lunge"]),

  defineExercise("arnold-press", "Arnold Press", "Shoulders", ["Anterior delts", "Medial delts"], ["Triceps"], "Overhead press", "Trains the delts through a large pressing arc with rotation.", ["Dumbbell Arnold Press"]),
  defineExercise("barbell-upright-row", "Barbell Upright Row", "Shoulders", ["Upper traps", "Front delts"], ["Lateral delts", "Biceps"], "Vertical pull", "Barbell pulled up along the body to chin height — targets the upper traps and front deltoid with heavy loading.", ["Dumbbell Upright Row", "Cable Upright Row"]),
  defineExercise("behind-the-neck-press", "Behind-the-Neck Press", "Shoulders", ["Lateral delts", "Front delts"], ["Triceps", "Upper traps"], "Vertical push", "Barbell pressing from behind the head to overhead — biases the lateral deltoid but requires significant shoulder mobility.", ["Overhead Press", "Seated Dumbbell Press"], ["Standing Behind Neck Press"]),
  defineExercise("bradford-press", "Bradford Press", "Shoulders", ["Front delts", "Lateral delts"], ["Triceps", "Upper traps"], "Vertical push", "Alternating front and behind-the-neck press in continuous arcs that builds shoulder endurance and mobility.", ["Overhead Press", "Arnold Press"], ["Barbell Standing Bradford Press"]),
  defineExercise("cable-front-raise", "Cable Front Raise", "Shoulders", ["Front delts"], ["Lateral delts"], "Shoulder flexion", "Low-cable front raise with constant tension throughout the arc compared to dumbbell version.", ["Front Raise", "Barbell Front Raise"]),
  defineExercise("cable-face-pull", "Cable Face Pull", "Shoulders", ["Rear delts", "External rotators"], ["Mid traps", "Rhomboids"], "Scapular retraction", "Builds rear-delt and upper-back balance while training external rotation.", ["Face Pull"]),
  defineExercise("cable-lateral-raise", "Cable Lateral Raise", "Shoulders", ["Medial delts"], ["Upper traps"], "Shoulder abduction", "Keeps tension on the side delts through the whole raise.", ["Cable Lateral Raise - For Mid Delt"]),
  defineExercise("dumbbell-upright-row", "Dumbbell Upright Row", "Shoulders", ["Upper traps", "Lateral delts"], ["Front delts", "Biceps"], "Vertical pull", "Dumbbell upright row allows a wider grip and more natural wrist path than the barbell version.", ["Barbell Upright Row", "Cable Lateral Raise"]),
  defineExercise("front-raise", "Front Raise", "Shoulders", ["Anterior delts"], ["Upper chest"], "Shoulder flexion", "Directly biases the front delts through shoulder flexion.", ["Dumbbell Front Raise"]),
  defineExercise("landmine-press", "Landmine Press", "Shoulders", ["Anterior delts"], ["Upper chest", "Triceps"], "Angled press", "Shoulder-friendly pressing variation that still trains upward pressing strength.", ["One-Arm Landmine Press"]),
  defineExercise("lateral-raise", "Lateral Raise", "Shoulders", ["Medial delts"], ["Upper traps"], "Shoulder abduction", "Simple delt-builder that directly targets shoulder width.", ["Dumbbell Lateral Raise"]),
  defineExercise("machine-lateral-raise", "Machine Lateral Raise", "Shoulders", ["Lateral delts"], ["Upper traps"], "Shoulder abduction", "Selectorized lateral raise with consistent resistance through the full range — no momentum at the bottom.", ["Lateral Raise", "Cable Lateral Raise"], ["Lever Lateral Raise"]),
  defineExercise("machine-shoulder-press", "Machine Shoulder Press", "Shoulders", ["Front delts", "Lateral delts"], ["Triceps", "Upper traps"], "Vertical push", "Guided overhead press machine that provides a fixed movement path — useful for high-volume shoulder work.", ["Seated Dumbbell Press", "Overhead Press"], ["Lever Shoulder Press"]),
  defineExercise("overhead-press", "Overhead Press", "Shoulders", ["Anterior delts", "Medial delts"], ["Triceps", "Upper traps"], "Vertical press", "Foundational shoulder strength movement with clear progression.", ["Standing Overhead Press", "Barbell Shoulder Press"]),
  defineExercise("prone-y-raise", "Prone Y Raise", "Shoulders", ["Lower traps", "Rear delts"], ["Rhomboids", "Mid traps"], "Shoulder elevation", "Lying face-down Y-arm raise builds lower trap and posterior shoulder stability — important rotator cuff health.", ["Prone T Raise", "Rear Delt Raise"], ["Y Raise"]),
  defineExercise("rear-delt-raise", "Rear Delt Raise", "Shoulders", ["Rear delts"], ["Rhomboids", "Mid traps"], "Horizontal abduction", "Directly loads the rear delts to balance pressing-heavy plans.", ["Rear Delt Dumbbell Raise"]),
  defineExercise("reverse-pec-deck", "Reverse Pec Deck", "Shoulders", ["Rear delts"], ["Mid traps", "Rhomboids"], "Horizontal abduction", "Stable rear-delt machine movement that is easy to perform strictly.", ["Rear Delt Machine Fly"]),
  defineExercise("seated-dumbbell-press", "Seated Dumbbell Press", "Shoulders", ["Anterior delts", "Medial delts"], ["Triceps"], "Vertical press", "Stable dumbbell press that lets each shoulder move independently.", ["Dumbbell Shoulder Press"]),
  defineExercise("single-arm-cable-lateral-raise", "Single-Arm Cable Lateral Raise", "Shoulders", ["Lateral delts"], ["Upper traps"], "Shoulder abduction", "Unilateral cable lateral raise provides constant tension and allows each shoulder to be trained independently.", ["Lateral Raise", "Machine Lateral Raise"], ["One Arm Lateral Raise", "Single-Arm Lateral Raise"]),

  defineExercise("barbell-overhead-triceps-extension", "Barbell Overhead Triceps Extension", "Triceps", ["Triceps"], ["Rear delts"], "Elbow extension", "Heavy barbell overhead extension that loads the long head of the triceps fully through a stretched position.", ["EZ-Bar Skullcrusher", "Dumbbell Overhead Triceps Extension"], ["Barbell Standing Overhead Triceps Extension", "Barbell Seated Overhead Triceps Extension"]),
  defineExercise("barbell-skullcrusher", "Barbell Skullcrusher", "Triceps", ["Triceps"], [], "Elbow extension", "Straight-bar lying triceps extension — heavier than EZ-bar and more lat/long head emphasis at the stretched position.", ["EZ-Bar Skullcrusher", "Lying Triceps Extension"], ["Barbell Skull Crusher", "Barbell Lying Triceps Extension"]),
  defineExercise("cable-overhead-triceps-extension", "Cable Overhead Triceps Extension", "Triceps", ["Triceps long head"], ["Lateral head", "Medial head"], "Elbow extension", "Biases the long head strongly because the shoulder stays flexed overhead.", ["Overhead Rope Extension"]),
  defineExercise("close-grip-barbell-bench-press", "Close-Grip Barbell Bench Press", "Triceps", ["Triceps"], ["Chest", "Anterior delts"], "Press", "Heavy compound press that strongly involves the triceps through lockout.", ["Close Grip Bench Press"]),
  defineExercise("close-grip-push-up", "Close-Grip Push-Up", "Triceps", ["Triceps", "Chest"], ["Anterior delts"], "Elbow extension", "Narrow-hand push-up that shifts emphasis from chest to triceps — scalable bodyweight pressing.", ["Push-Up", "Parallel Bar Dip"], ["Close-grip Push-up"]),
  defineExercise("dumbbell-overhead-triceps-extension", "Dumbbell Overhead Triceps Extension", "Triceps", ["Triceps long head"], ["Lateral head"], "Elbow extension", "Loads the long head with a deep overhead stretch.", ["Overhead Dumbbell Extension"]),
  defineExercise("ez-bar-skullcrusher", "EZ-Bar Skullcrusher", "Triceps", ["Triceps long head", "Lateral head"], ["Medial head"], "Elbow extension", "Direct triceps builder that allows substantial loading in a lying setup.", ["EZ-Bar Lying Triceps Extension", "Skullcrusher"]),
  defineExercise("lying-triceps-extension", "Lying Triceps Extension", "Triceps", ["Triceps"], ["Shoulders"], "Elbow extension", "Classic free-weight isolation movement for all three triceps heads.", ["French Press"]),
  defineExercise("parallel-bar-dip", "Parallel Bar Dip", "Triceps", ["Triceps"], ["Chest", "Anterior delts"], "Press", "Bodyweight press that can heavily load the triceps when kept upright.", ["Triceps Dip"]),
  defineExercise("rope-pushdown", "Rope Pushdown", "Triceps", ["Triceps lateral head", "Triceps medial head"], ["Long head"], "Elbow extension", "Easy-to-control cable isolation movement with strong lockout tension.", ["Rope Push Down"]),
  defineExercise("single-arm-pushdown", "Single-Arm Pushdown", "Triceps", ["Triceps"], [], "Elbow extension", "Unilateral cable pushdown that allows each arm to be isolated and trained through its full range independently.", ["Rope Pushdown", "V-Bar Pushdown"], ["Single Arm Pushdown"]),
  defineExercise("tate-press", "Tate Press", "Triceps", ["Triceps"], ["Chest"], "Elbow extension", "Dumbbell triceps press where elbows flare out wide — biases the outer triceps head through a short arc.", ["Lying Triceps Extension", "EZ-Bar Skullcrusher"], ["Dumbbell Tate Press"]),
  defineExercise("triceps-kickback", "Triceps Kickback", "Triceps", ["Triceps"], [], "Elbow extension", "Shortened-range isolation move that keeps tension near lockout.", ["Dumbbell Kickback"]),
  defineExercise("triceps-extension-machine", "Triceps Extension Machine", "Triceps", ["Triceps"], [], "Elbow extension", "Stable machine-based triceps isolation that is easy to progress and control.", ["Triceps Extensions (Machine)"]),
  defineExercise("v-bar-pushdown", "V-Bar Pushdown", "Triceps", ["Triceps lateral head", "Triceps medial head"], ["Long head"], "Elbow extension", "Pushdown variation with a fixed grip that feels strong and stable for heavier work.", ["V-Bar Push Down"]),
  defineExercise("weighted-dip", "Weighted Dip", "Triceps", ["Triceps", "Chest"], ["Anterior delts"], "Elbow extension", "Belt-loaded parallel bar dip with added weight — builds pressing strength and triceps mass at compound intensity.", ["Parallel Bar Dip", "Close-Grip Barbell Bench Press"])
].sort((left, right) => {
  const categoryDiff = exerciseCategoryOrder.indexOf(left.category) - exerciseCategoryOrder.indexOf(right.category);
  if (categoryDiff !== 0) {
    return categoryDiff;
  }
  return left.name.localeCompare(right.name);
});

const curatedExerciseKeys = new Set(
  curatedExerciseLibrary.flatMap((exercise) => [exercise.name, ...exercise.aliases]).map((value) => value.trim().toLowerCase())
);

export const exerciseLibrary: ExerciseDefinition[] = [
  ...curatedExerciseLibrary,
  ...lyftaExerciseLibrary.filter((exercise) => !curatedExerciseKeys.has(exercise.name.trim().toLowerCase()))
].sort((left, right) => {
  const categoryDiff = exerciseCategoryOrder.indexOf(left.category) - exerciseCategoryOrder.indexOf(right.category);
  if (categoryDiff !== 0) {
    return categoryDiff;
  }
  return left.name.localeCompare(right.name);
});
