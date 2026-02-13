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
  protocolLink?: string;
  protocolLabelEn?: string;
  protocolLabelAr?: string;
};

export const cr7BodyParts: BodyPart[] = [
  {
    id: "jawline",
    titleEn: "Jawline",
    titleAr: "خط الفك",
    descriptionEn:
      "Ronaldo's razor-sharp jawline sits at an ideal 120-130 degree mandibular angle with minimal submental fat. Well-developed masseter muscles add width and angularity to the lower face.",
    descriptionAr:
      "خط فك رونالدو الحاد بزاوية مثالية 120-130 درجة مع الحد الأدنى من الدهون تحت الذقن. عضلات الماضغة المتطورة تضيف عرضاً وزوايا حادة للوجه السفلي.",
    howToEn:
      "Maintain body fat below 12% to reveal jaw structure. Practice proper tongue posture (mewing) with tongue pressed against palate. Chew mastic gum 20 minutes daily to hypertrophy the masseter.",
    howToAr:
      "حافظ على نسبة دهون أقل من 12% لإبراز بنية الفك. مارس وضعية اللسان الصحيحة بضغط اللسان على سقف الحلق. امضغ علكة المستكة 20 دقيقة يومياً لتضخيم عضلة الماضغة.",
    position: { top: 10, left: 48 },
    side: "right",
    icon: "Scan",
    protocolLink: "/#protocol-form",
    protocolLabelEn: "Generate AI Protocol",
    protocolLabelAr: "إنشاء بروتوكول بالذكاء الاصطناعي",
  },
  {
    id: "neck",
    titleEn: "Neck (SCM)",
    titleAr: "الرقبة (العضلة القصية)",
    descriptionEn:
      "Ronaldo's thick sternocleidomastoid muscles give his neck a powerful, column-like appearance. His neck circumference is estimated at 16-17 inches, well above average, with visible striations.",
    descriptionAr:
      "عضلات رونالدو القصية الترقوية السميكة تمنح رقبته مظهراً قوياً يشبه العمود. يُقدَّر محيط رقبته بـ 16-17 بوصة مع تحززات مرئية.",
    howToEn:
      "Perform weighted neck curls (front and back) 3x15 reps, 3 times per week. Include barbell shrugs and farmer's walks for trapezius development. Practice neck bridges progressively. Add isometric neck holds against resistance bands.",
    howToAr:
      "أدِّ تمارين ثني الرقبة بالأوزان 3 مجموعات × 15 تكراراً، 3 مرات أسبوعياً. أضف تمارين رفع الأكتاف بالبار والمشي بالأثقال. مارس جسور الرقبة تدريجياً. أضف تثبيتات متساوية القياس بأشرطة المقاومة.",
    position: { top: 15, left: 45 },
    side: "left",
    icon: "Activity",
    protocolLink: "/protocol/ronaldo-neck",
    protocolLabelEn: "View 7-Day Protocol",
    protocolLabelAr: "عرض البروتوكول",
  },
  {
    id: "shoulders",
    titleEn: "Shoulders (Delts)",
    titleAr: "الأكتاف (الدالية)",
    descriptionEn:
      "CR7's capped, three-dimensional deltoids create his wide shoulder frame. All three deltoid heads are proportionally developed, with a shoulder-to-waist ratio exceeding 1.6:1.",
    descriptionAr:
      "عضلات رونالدو الدالية المحدبة ثلاثية الأبعاد تصنع إطار أكتافه العريض. جميع رؤوس العضلة الدالية الثلاثة متطورة بتناسب مع نسبة كتف إلى خصر تتجاوز 1.6:1.",
    howToEn:
      "Prioritize lateral raises (4x15) with controlled eccentrics for width. Overhead press 4x8-10 for overall mass. Rear delt flyes and face pulls 3x20 for posterior development. Train shoulders twice weekly.",
    howToAr:
      "ركّز على الرفع الجانبي (4×15) مع تحكم في مرحلة الإنزال للعرض. الضغط فوق الرأس 4×8-10 للكتلة الشاملة. تمارين الفراشة الخلفية وسحب الوجه 3×20. درّب الأكتاف مرتين أسبوعياً.",
    position: { top: 23, left: 70 },
    side: "right",
    icon: "Mountain",
    protocolLink: "/#protocol-form",
    protocolLabelEn: "Generate AI Protocol",
    protocolLabelAr: "إنشاء بروتوكول بالذكاء الاصطناعي",
  },
  {
    id: "chest",
    titleEn: "Chest (Pecs)",
    titleAr: "الصدر (العضلة الصدرية)",
    descriptionEn:
      "Ronaldo's full, squared-off pecs feature a well-defined upper chest shelf. The sternal and clavicular heads are equally developed, with a deep chest separation line visible even at rest.",
    descriptionAr:
      "صدر رونالدو الممتلئ المربع يتميز برف صدري علوي محدد. الرأسان القصي والترقوي متطوران بالتساوي، مع خط فصل عميق مرئي حتى في الراحة.",
    howToEn:
      "Incline dumbbell press (30-degree) 4x8-12 for upper chest priority. Flat barbell bench press 4x6-8 for mass. Cable flyes at multiple angles 3x12-15 for isolation. Include dips for lower chest.",
    howToAr:
      "ضغط الدمبل المائل (30 درجة) 4×8-12 لأولوية الصدر العلوي. ضغط البار المستوي 4×6-8 للكتلة. تمارين الفراشة بالكيبل 3×12-15 للعزل. أضف تمارين الغطس للصدر السفلي.",
    position: { top: 34, left: 42 },
    side: "left",
    icon: "Shield",
    protocolLink: "/#protocol-form",
    protocolLabelEn: "Generate AI Protocol",
    protocolLabelAr: "إنشاء بروتوكول بالذكاء الاصطناعي",
  },
  {
    id: "arms",
    titleEn: "Arms (Biceps/Triceps)",
    titleAr: "الذراعان (ذات الرأسين/ثلاثية الرؤوس)",
    descriptionEn:
      "CR7's arms display perfect balance between bicep peak and tricep horseshoe at approximately 15-15.5 inches. Lean and defined rather than bulky, with visible brachialis creating arm width.",
    descriptionAr:
      "ذراعا رونالدو تُظهران توازناً مثالياً بين ذروة ذات الرأسين وحدوة ثلاثية الرؤوس بقياس 15-15.5 بوصة. نحيفتان ومحددتان مع عضلة عضدية مرئية.",
    howToEn:
      "Barbell curls 3x8-10 for bicep mass. Incline dumbbell curls 3x12 for long head stretch. Overhead tricep extensions 3x10-12 for long head emphasis. Hammer curls 3x12 for brachialis.",
    howToAr:
      "ثني البار 3×8-10 لكتلة ذات الرأسين. ثني الدمبل المائل 3×12 لتمدد الرأس الطويل. تمديد ثلاثية الرؤوس فوق الرأس 3×10-12. ثني المطرقة 3×12 للعضلة العضدية.",
    position: { top: 37, left: 25 },
    side: "left",
    icon: "Dumbbell",
    protocolLink: "/#protocol-form",
    protocolLabelEn: "Generate AI Protocol",
    protocolLabelAr: "إنشاء بروتوكول بالذكاء الاصطناعي",
  },
  {
    id: "forearms",
    titleEn: "Forearm Veins",
    titleAr: "عروق الساعد",
    descriptionEn:
      "Ronaldo's forearm vascularity is exceptional, with the cephalic vein running prominently along the lateral forearm. This indicates body fat under 10%, high nitric oxide levels, and well-developed forearm musculature.",
    descriptionAr:
      "بروز عروق ساعد رونالدو استثنائي، حيث يمتد الوريد الرأسي بشكل بارز على طول الساعد. هذا يشير إلى نسبة دهون أقل من 10% ومستويات عالية من أكسيد النيتريك.",
    howToEn:
      "Heavy grip training: dead hangs, farmer's walks, and grip crushers daily. Wrist curls and reverse wrist curls 3x20 for forearm pump. Maintain body fat below 10%. Increase nitric oxide with beets and citrulline.",
    howToAr:
      "تدريب القبضة الثقيل: التعلق والمشي بالأثقال وأدوات ضغط القبضة يومياً. ثني الرسغ والثني العكسي 3×20 لضخ الساعد. حافظ على دهون أقل من 10%. زِد أكسيد النيتريك بالشمندر والسيترولين.",
    position: { top: 53, left: 73 },
    side: "right",
    icon: "Droplets",
    protocolLink: "/protocol/hand-veins",
    protocolLabelEn: "View 7-Day Protocol",
    protocolLabelAr: "عرض البروتوكول",
  },
  {
    id: "abs",
    titleEn: "Six Pack Abs",
    titleAr: "عضلات البطن الست",
    descriptionEn:
      "CR7 possesses a visible 8-pack with deep tendinous inscriptions and symmetrical muscle blocks. The linea alba is deeply etched, visible even at rest, indicating extremely low body fat.",
    descriptionAr:
      "يمتلك رونالدو عضلات بطن من 8 أقسام مرئية مع نقوش وترية عميقة وكتل عضلية متناظرة. الخط الأبيض محفور بعمق مرئي حتى في الراحة.",
    howToEn:
      "Hanging leg raises 4x15 for lower abs. Cable crunches 4x12-15 for rectus hypertrophy. Ab wheel rollouts 3x10 for eccentric overload. Maintain caloric deficit with high protein (2g/kg).",
    howToAr:
      "رفع الأرجل المعلق 4×15 للبطن السفلي. طحن الكيبل 4×12-15 لتضخم العضلة المستقيمة. تمارين عجلة البطن 3×10. حافظ على عجز سعرات مع بروتين عالي (2 غم/كغم).",
    position: { top: 47, left: 50 },
    side: "right",
    icon: "Target",
    protocolLink: "/#protocol-form",
    protocolLabelEn: "Generate AI Protocol",
    protocolLabelAr: "إنشاء بروتوكول بالذكاء الاصطناعي",
  },
  {
    id: "vtaper",
    titleEn: "V-Taper / Obliques",
    titleAr: "شكل V / العضلات المائلة",
    descriptionEn:
      "Ronaldo's V-taper features broad lats flaring from a narrow 31-inch waist. His Adonis belt creates dramatic V-lines, with external obliques showing striated definition without being blocky.",
    descriptionAr:
      "شكل V لدى رونالدو يتميز بعضلات ظهرية عريضة من خصر ضيق 31 بوصة. حزام أدونيس يخلق خطوط V دراماتيكية مع عضلات مائلة محددة دون ضخامة مفرطة.",
    howToEn:
      "Wide-grip pull-ups 4x8-12 for lat width. Cable woodchops 3x15 per side for rotational strength. Side planks 3x45 seconds for oblique engagement. Vacuum poses daily to tighten the waist.",
    howToAr:
      "سحب العقلة بقبضة واسعة 4×8-12 لعرض الظهرية. تقطيع الحطب بالكيبل 3×15 لكل جانب. بلانك جانبي 3×45 ثانية للمائلة. تمارين الفراغ يومياً لشد الخصر.",
    position: { top: 56, left: 38 },
    side: "left",
    icon: "Triangle",
    protocolLink: "/#protocol-form",
    protocolLabelEn: "Generate AI Protocol",
    protocolLabelAr: "إنشاء بروتوكول بالذكاء الاصطناعي",
  },
];
