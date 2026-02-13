export type BodyPart = {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  howToEn: string;
  howToAr: string;
  position: { top: number; left: number };
  side: "left" | "right";
  icon: string;
};

export const cr7BodyParts: BodyPart[] = [
  {
    id: "jawline",
    titleEn: "Jawline",
    titleAr: "خط الفك",
    descriptionEn:
      "Ronaldo's razor-sharp jawline is one of his most iconic features. His mandibular angle sits at an ideal 120-130 degrees, with minimal submental fat creating maximum definition between the jaw and neck. The masseter muscles are well-developed, adding width and angularity to the lower face.",
    descriptionAr:
      "خط فك رونالدو الحاد هو من أبرز سماته الجسدية. تبلغ زاوية الفك السفلي لديه 120-130 درجة مثالية، مع الحد الأدنى من الدهون تحت الذقن مما يخلق أقصى تحديد بين الفك والرقبة. عضلات الماضغة متطورة بشكل جيد، مما يضيف عرضاً وزوايا حادة للوجه السفلي.",
    howToEn:
      "Maintain body fat below 12% to reveal jaw structure. Practice proper tongue posture (mewing) with tongue pressed against palate. Chew mastic gum 20 minutes daily to hypertrophy the masseter. Perform jaw clenches and neck exercises to tighten submental area.",
    howToAr:
      "حافظ على نسبة دهون الجسم أقل من 12% لإبراز بنية الفك. مارس وضعية اللسان الصحيحة (الميوينغ) بضغط اللسان على سقف الحلق. امضغ علكة المستكة 20 دقيقة يومياً لتضخيم عضلة الماضغة. أدِّ تمارين شد الفك والرقبة لشد المنطقة تحت الذقن.",
    position: { top: 8, left: 50 },
    side: "right",
    icon: "Scan",
  },
  {
    id: "neck",
    titleEn: "Neck (SCM)",
    titleAr: "الرقبة (العضلة القصية)",
    descriptionEn:
      "Ronaldo's thick sternocleidomastoid (SCM) muscles give his neck a powerful, column-like appearance. The SCM runs diagonally from behind the ear to the collarbone, creating visible striations and a masculine neck profile. His neck circumference is estimated at 16-17 inches, well above average.",
    descriptionAr:
      "عضلات رونالدو القصية الترقوية الخشائية السميكة تمنح رقبته مظهراً قوياً يشبه العمود. تمتد العضلة القصية بشكل مائل من خلف الأذن إلى عظمة الترقوة، مما يخلق تحززات مرئية وملامح رقبة ذكورية. يُقدَّر محيط رقبته بـ 16-17 بوصة، وهو أعلى بكثير من المتوسط.",
    howToEn:
      "Perform weighted neck curls (front and back) 3x15 reps, 3 times per week. Include barbell shrugs and farmer's walks for trapezius development. Practice neck bridges progressively. Add isometric neck holds against resistance bands for endurance.",
    howToAr:
      "أدِّ تمارين ثني الرقبة بالأوزان (أمامية وخلفية) 3 مجموعات × 15 تكراراً، 3 مرات أسبوعياً. أضف تمارين رفع الأكتاف بالبار والمشي بالأثقال لتطوير العضلة شبه المنحرفة. مارس جسور الرقبة تدريجياً. أضف تثبيتات متساوية القياس للرقبة بأشرطة المقاومة.",
    position: { top: 14, left: 42 },
    side: "left",
    icon: "Activity",
  },
  {
    id: "shoulders",
    titleEn: "Shoulders (Delts)",
    titleAr: "الأكتاف (الدالية)",
    descriptionEn:
      "CR7's capped, three-dimensional deltoids create the wide shoulder frame that defines his V-taper silhouette. All three deltoid heads (anterior, lateral, posterior) are proportionally developed, with the lateral head creating that coveted cannonball roundness. His shoulder-to-waist ratio exceeds 1.6:1.",
    descriptionAr:
      "عضلات رونالدو الدالية المحدبة ثلاثية الأبعاد تصنع إطار الأكتاف العريض الذي يحدد شكله المثلث المقلوب. جميع رؤوس العضلة الدالية الثلاثة (الأمامية والجانبية والخلفية) متطورة بتناسب، مع الرأس الجانبي الذي يخلق تلك الاستدارة المرغوبة. نسبة الكتف إلى الخصر لديه تتجاوز 1.6:1.",
    howToEn:
      "Prioritize lateral raises (4x15) with controlled eccentrics for medial delt width. Overhead press (barbell or dumbbell) 4x8-10 for overall mass. Rear delt flyes and face pulls 3x20 for posterior development. Train shoulders twice weekly with progressive overload.",
    howToAr:
      "ركّز على الرفع الجانبي (4×15) مع تحكم في مرحلة الإنزال لعرض الرأس الجانبي. الضغط فوق الرأس (بار أو دمبل) 4×8-10 للكتلة الشاملة. تمارين الفراشة الخلفية وسحب الوجه 3×20 لتطوير الرأس الخلفي. درّب الأكتاف مرتين أسبوعياً مع زيادة تدريجية.",
    position: { top: 20, left: 65 },
    side: "right",
    icon: "Mountain",
  },
  {
    id: "chest",
    titleEn: "Chest (Pecs)",
    titleAr: "الصدر (العضلة الصدرية)",
    descriptionEn:
      "Ronaldo's pectoral development showcases full, squared-off pecs with a well-defined upper chest shelf. The sternal and clavicular heads are equally developed, creating a chest that looks powerful from every angle. His chest separation line is deep and well-defined even at rest.",
    descriptionAr:
      "تطور العضلة الصدرية لدى رونالدو يُظهر صدراً ممتلئاً مربع الشكل مع رف صدري علوي محدد بوضوح. الرأسان القصي والترقوي متطوران بالتساوي، مما يخلق صدراً يبدو قوياً من كل زاوية. خط فصل الصدر عميق ومحدد حتى في وضع الراحة.",
    howToEn:
      "Incline dumbbell press (30-degree angle) 4x8-12 for upper chest priority. Flat barbell bench press 4x6-8 for overall mass. Cable flyes at multiple angles 3x12-15 for isolation and stretch. Include dips for lower chest development. Focus on mind-muscle connection.",
    howToAr:
      "ضغط الدمبل المائل (زاوية 30 درجة) 4×8-12 لأولوية الصدر العلوي. ضغط البار المستوي 4×6-8 للكتلة الشاملة. تمارين الفراشة بالكيبل من زوايا متعددة 3×12-15 للعزل والتمدد. أضف تمارين الغطس لتطوير الصدر السفلي. ركّز على الاتصال الذهني بالعضلة.",
    position: { top: 28, left: 45 },
    side: "left",
    icon: "Shield",
  },
  {
    id: "arms",
    titleEn: "Arms (Biceps/Triceps)",
    titleAr: "الذراعان (العضلة ذات الرأسين/ثلاثية الرؤوس)",
    descriptionEn:
      "CR7's arms display a perfect balance between bicep peak and tricep horseshoe. His arms measure approximately 15-15.5 inches, lean and defined rather than bulky. The brachialis muscle is visible between the bicep and tricep, creating arm width. The long head of the triceps is particularly well-developed.",
    descriptionAr:
      "ذراعا رونالدو تُظهران توازناً مثالياً بين ذروة العضلة ذات الرأسين وحدوة حصان ثلاثية الرؤوس. يبلغ قياس ذراعيه تقريباً 15-15.5 بوصة، نحيفتان ومحددتان بدلاً من ضخامة مفرطة. العضلة العضدية مرئية بين ذات الرأسين وثلاثية الرؤوس، مما يخلق عرضاً للذراع.",
    howToEn:
      "Barbell curls 3x8-10 for bicep mass. Incline dumbbell curls 3x12 for long head stretch. Overhead tricep extensions 3x10-12 for long head emphasis. Close-grip bench press 3x8 for tricep thickness. Hammer curls 3x12 for brachialis development.",
    howToAr:
      "ثني البار 3×8-10 لكتلة ذات الرأسين. ثني الدمبل المائل 3×12 لتمدد الرأس الطويل. تمديد ثلاثية الرؤوس فوق الرأس 3×10-12 للتركيز على الرأس الطويل. ضغط البار بقبضة ضيقة 3×8 لسماكة ثلاثية الرؤوس. ثني المطرقة 3×12 لتطوير العضلة العضدية.",
    position: { top: 35, left: 28 },
    side: "left",
    icon: "Dumbbell",
  },
  {
    id: "forearms",
    titleEn: "Forearm Veins",
    titleAr: "عروق الساعد",
    descriptionEn:
      "Ronaldo's forearm vascularity is exceptional, with the cephalic vein running prominently along the lateral forearm and branching across the dorsal hand. This level of vascularity indicates body fat under 10%, high nitric oxide levels, excellent hydration management, and well-developed forearm musculature pushing veins to the surface.",
    descriptionAr:
      "بروز عروق ساعد رونالدو استثنائي، حيث يمتد الوريد الرأسي بشكل بارز على طول الساعد الجانبي ويتفرع عبر ظهر اليد. هذا المستوى من بروز العروق يشير إلى نسبة دهون أقل من 10%، ومستويات عالية من أكسيد النيتريك، وإدارة ممتازة للترطيب، وعضلات ساعد متطورة تدفع العروق للسطح.",
    howToEn:
      "Heavy grip training: dead hangs, farmer's walks, and grip crushers daily. Wrist curls and reverse wrist curls 3x20 for forearm pump. Maintain body fat below 10%. Increase nitric oxide naturally with beets, citrulline, and dark leafy greens. Manage sodium and water intake strategically.",
    howToAr:
      "تدريب القبضة الثقيل: التعلق، والمشي بالأثقال، وأدوات ضغط القبضة يومياً. ثني الرسغ والثني العكسي 3×20 لضخ الساعد. حافظ على نسبة دهون أقل من 10%. زِد أكسيد النيتريك طبيعياً بالشمندر والسيترولين والخضروات الورقية الداكنة. أدِر تناول الصوديوم والماء بشكل استراتيجي.",
    position: { top: 42, left: 72 },
    side: "right",
    icon: "Droplets",
  },
  {
    id: "abs",
    titleEn: "Six Pack Abs",
    titleAr: "عضلات البطن الست",
    descriptionEn:
      "CR7 possesses a visible 8-pack rectus abdominis with deep tendinous inscriptions creating pronounced muscle blocks. His abdominal development is symmetrical with each segment equally sized. The linea alba (center line) is deeply etched, and the rectus sheath is visible even during relaxation, indicating extremely low visceral and subcutaneous fat.",
    descriptionAr:
      "يمتلك رونالدو عضلات بطن مستقيمة من 8 أقسام مرئية مع نقوش وترية عميقة تخلق كتلاً عضلية بارزة. تطور بطنه متناظر مع تساوي حجم كل قسم. الخط الأبيض (الخط المركزي) محفور بعمق، وغمد العضلة المستقيمة مرئي حتى أثناء الاسترخاء، مما يدل على انخفاض شديد في الدهون الحشوية وتحت الجلد.",
    howToEn:
      "Hanging leg raises 4x15 for lower abs activation. Cable crunches 4x12-15 for rectus hypertrophy. Ab wheel rollouts 3x10 for eccentric overload. Maintain caloric deficit with high protein (2g/kg). Eliminate processed sugars and refined carbs. Abs are revealed at sub-10% body fat.",
    howToAr:
      "رفع الأرجل المعلق 4×15 لتنشيط البطن السفلي. طحن الكيبل 4×12-15 لتضخم العضلة المستقيمة. تمارين عجلة البطن 3×10 للحمل اللامركزي. حافظ على عجز سعرات مع بروتين عالي (2 غم/كغم). أزِل السكريات المصنعة والكربوهيدرات المكررة. تظهر البطن عند نسبة دهون أقل من 10%.",
    position: { top: 40, left: 50 },
    side: "left",
    icon: "Target",
  },
  {
    id: "vtaper",
    titleEn: "V-Taper",
    titleAr: "شكل V (المثلث المقلوب)",
    descriptionEn:
      "Ronaldo's V-taper is textbook perfection: broad latissimus dorsi muscles flaring out from a narrow 31-inch waist to wide shoulders. This creates the illusion of an even smaller waist and amplifies upper body dominance. His lat insertions are low, giving maximum back width and creating that cobra-like spread from behind.",
    descriptionAr:
      "شكل V لدى رونالدو يمثل الكمال المرجعي: عضلات ظهرية عريضة تتوهج من خصر ضيق بقياس 31 بوصة إلى أكتاف عريضة. هذا يخلق وهماً بخصر أصغر ويضخم هيمنة الجزء العلوي. نقاط ارتكاز العضلة الظهرية لديه منخفضة، مما يعطي أقصى عرض للظهر ويخلق انتشاراً يشبه الكوبرا من الخلف.",
    howToEn:
      "Wide-grip pull-ups 4x8-12 as primary lat builder. Barbell rows 4x8-10 for back thickness. Single-arm dumbbell rows 3x10-12 for unilateral development. Straight-arm pulldowns 3x15 for lat isolation. Vacuum poses daily to tighten the transversus abdominis and shrink the waist.",
    howToAr:
      "سحب العقلة بقبضة واسعة 4×8-12 كبانٍ أساسي للعضلة الظهرية. تجديف البار 4×8-10 لسماكة الظهر. تجديف الدمبل بذراع واحدة 3×10-12 للتطوير الأحادي. السحب بالذراع المستقيمة 3×15 لعزل الظهرية. تمارين الفراغ يومياً لشد العضلة البطنية المستعرضة وتنحيف الخصر.",
    position: { top: 32, left: 35 },
    side: "left",
    icon: "Triangle",
  },
  {
    id: "obliques",
    titleEn: "Obliques (Adonis Belt)",
    titleAr: "العضلات المائلة (حزام أدونيس)",
    descriptionEn:
      "CR7's Adonis belt (iliac furrows) creates dramatic V-lines running from the hip bones toward the groin. These inguinal ligament grooves are only visible at very low body fat percentages. His external obliques are developed enough to show striated definition along the sides of the torso without being blocky or overdeveloped.",
    descriptionAr:
      "حزام أدونيس لدى رونالدو (أخاديد الحرقفة) يخلق خطوط V دراماتيكية تمتد من عظام الورك نحو المنطقة الإربية. هذه الأخاديد في الرباط الإربي مرئية فقط عند نسب دهون منخفضة جداً. عضلاته المائلة الخارجية متطورة بما يكفي لإظهار تحديد مخطط على جانبي الجذع دون أن تكون مربعة أو مفرطة التطور.",
    howToEn:
      "Cable woodchops 3x15 per side for rotational strength. Pallof press 3x12 for anti-rotation stability. Side planks 3x45 seconds for isometric oblique engagement. Decline oblique crunches 3x15. Most critically: maintain body fat at 8-10% through consistent caloric deficit and LISS cardio.",
    howToAr:
      "تقطيع الحطب بالكيبل 3×15 لكل جانب للقوة الدورانية. ضغط بالوف 3×12 لثبات مضاد للدوران. بلانك جانبي 3×45 ثانية للانخراط المتساوي القياس للمائلة. طحن مائل منحدر 3×15. الأهم: حافظ على نسبة دهون 8-10% من خلال عجز سعرات ثابت وكارديو منخفض الشدة.",
    position: { top: 48, left: 55 },
    side: "right",
    icon: "Flame",
  },
  {
    id: "quads",
    titleEn: "Quadriceps",
    titleAr: "العضلة الرباعية",
    descriptionEn:
      "Ronaldo's quadriceps are among the most powerful in professional football. The vastus medialis (teardrop) is particularly prominent near the knee, while the rectus femoris shows a central sweep. His quad development supports explosive sprinting (reaching 36.9 km/h) and generates over 2,000 N of force during kicks, making him one of the most powerful strikers in history.",
    descriptionAr:
      "عضلات رونالدو الرباعية من بين الأقوى في كرة القدم الاحترافية. العضلة المتسعة الإنسية (الدمعة) بارزة بشكل خاص قرب الركبة، بينما يُظهر العضل المستقيم الفخذي انحناءً مركزياً. تطور عضلاته الرباعية يدعم العدو الانفجاري (يصل إلى 36.9 كم/ساعة) ويولد أكثر من 2000 نيوتن من القوة أثناء التسديد.",
    howToEn:
      "Back squats 4x6-8 as foundation compound movement. Leg press 4x10-12 for volume loading. Bulgarian split squats 3x10 per leg for unilateral strength. Leg extensions 3x15 for quad isolation and VMO targeting. Sprint intervals (8x100m) twice weekly for athletic quad development.",
    howToAr:
      "القرفصاء الخلفي 4×6-8 كحركة مركبة أساسية. ضغط الأرجل 4×10-12 لحمل الحجم. القرفصاء البلغارية المنقسمة 3×10 لكل رجل للقوة الأحادية. تمديد الأرجل 3×15 لعزل الرباعية واستهداف المتسعة الإنسية. فترات العدو (8×100م) مرتين أسبوعياً لتطوير رباعية رياضية.",
    position: { top: 60, left: 42 },
    side: "left",
    icon: "Zap",
  },
  {
    id: "calves",
    titleEn: "Calves",
    titleAr: "عضلات الساق",
    descriptionEn:
      "CR7's calves display the classic diamond shape with well-developed medial and lateral gastrocnemius heads. The soleus muscle beneath adds depth and fullness. His calf development is both aesthetic and functional, enabling explosive vertical jumps (reaching headers at 2.56m height) and rapid deceleration during cutting movements on the pitch.",
    descriptionAr:
      "عضلات ساق رونالدو تُظهر الشكل الماسي الكلاسيكي مع تطور جيد للرأسين الإنسي والجانبي لعضلة الساق. عضلة النعلية تحتها تضيف عمقاً وامتلاءً. تطور ساقيه جمالي ووظيفي، يمكّنه من القفز العمودي الانفجاري (رأسيات على ارتفاع 2.56 متر) والتباطؤ السريع أثناء حركات القطع في الملعب.",
    howToEn:
      "Standing calf raises 5x15-20 with full range of motion and 2-second pause at peak contraction. Seated calf raises 4x20 targeting the soleus. Explosive box jumps 4x8 for fast-twitch fiber recruitment. Single-leg calf raises 3x12 for symmetry. Jump rope 10 minutes daily for calf endurance and definition.",
    howToAr:
      "رفع الساق واقفاً 5×15-20 بمدى حركة كامل وتوقف ثانيتين عند ذروة الانقباض. رفع الساق جالساً 4×20 لاستهداف النعلية. قفزات الصندوق الانفجارية 4×8 لتجنيد الألياف سريعة الانقباض. رفع الساق بقدم واحدة 3×12 للتناظر. نط الحبل 10 دقائق يومياً لتحمل وتحديد الساق.",
    position: { top: 78, left: 55 },
    side: "right",
    icon: "Footprints",
  },
  {
    id: "bodyfat",
    titleEn: "Body Fat %",
    titleAr: "نسبة دهون الجسم",
    descriptionEn:
      "Ronaldo maintains an extraordinary 7-8% body fat year-round, well below the athletic average of 10-14%. This level of leanness reveals every muscle fiber, vein, and tendinous inscription across his physique. His disciplined nutrition protocol, combined with 3-4 hours of daily training, creates a metabolic environment that prioritizes fat oxidation while preserving lean muscle mass.",
    descriptionAr:
      "يحافظ رونالدو على نسبة دهون استثنائية تتراوح بين 7-8% على مدار العام، وهي أقل بكثير من المتوسط الرياضي البالغ 10-14%. هذا المستوى من النحافة يكشف كل ألياف عضلية ووريد ونقش وتري عبر جسمه. بروتوكوله الغذائي المنضبط، مع 3-4 ساعات تدريب يومي، يخلق بيئة أيضية تعطي أولوية لأكسدة الدهون مع الحفاظ على الكتلة العضلية.",
    howToEn:
      "Calculate TDEE and maintain a 300-500 calorie deficit. Consume 2.2g protein per kg of bodyweight to preserve muscle. Implement 16:8 intermittent fasting. Perform HIIT 3x weekly (20 minutes) and LISS cardio 2x weekly (40 minutes). Eliminate processed foods, sugar, and alcohol. Sleep 7-9 hours for optimal hormonal profile and cortisol management.",
    howToAr:
      "احسب إجمالي استهلاك الطاقة اليومي وحافظ على عجز 300-500 سعرة. تناول 2.2 غم بروتين لكل كغم من وزن الجسم للحفاظ على العضلات. طبّق الصيام المتقطع 16:8. أدِّ تدريب HIIT 3 مرات أسبوعياً (20 دقيقة) وكارديو منخفض الشدة مرتين (40 دقيقة). أزِل الأطعمة المصنعة والسكر والكحول. نَم 7-9 ساعات لملف هرموني مثالي وإدارة الكورتيزول.",
    position: { top: 52, left: 30 },
    side: "left",
    icon: "Percent",
  },
];
