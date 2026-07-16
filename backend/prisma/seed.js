const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Users ─────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const teacherPassword = await bcrypt.hash('Teacher123!', 12);
  const studentPassword = await bcrypt.hash('Student123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { fullName: 'System Admin', email: 'admin@example.com', password: adminPassword, role: 'ADMIN' },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: { fullName: 'Abebe Girma', email: 'teacher@example.com', password: teacherPassword, role: 'TEACHER' },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: { fullName: 'Tigist Haile', email: 'student@example.com', password: studentPassword, role: 'STUDENT' },
  });

  console.log('✅ Users created');

  // ─── Subjects ──────────────────────────────────────────────────────────────
  const subjectData = [
    { name: 'Mathematics', category: 'NATURAL' },
    { name: 'Physics', category: 'NATURAL' },
    { name: 'Chemistry', category: 'NATURAL' },
    { name: 'Biology', category: 'NATURAL' },
    { name: 'ICT', category: 'NATURAL' },
    { name: 'History', category: 'SOCIAL' },
    { name: 'Geography', category: 'SOCIAL' },
    { name: 'Economics', category: 'SOCIAL' },
    { name: 'Civics', category: 'SOCIAL' },
    { name: 'English', category: 'SOCIAL' },
  ];

  const subjects = {};
  for (const s of subjectData) {
    const subj = await prisma.subject.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
    subjects[s.name] = subj;
  }

  console.log('✅ Subjects created');

  // ─── Questions (50 total) ──────────────────────────────────────────────────
  const questionData = [
    // Mathematics (10)
    { subjectId: subjects['Mathematics'].id, question: 'What is the value of sin(90°)?', optionA: '0', optionB: '1', optionC: '-1', optionD: '0.5', correctAnswer: 'B', explanation: 'sin(90°) = 1 by definition of the sine function.' },
    { subjectId: subjects['Mathematics'].id, question: 'What is the derivative of x² with respect to x?', optionA: 'x', optionB: '2', optionC: '2x', optionD: 'x²', correctAnswer: 'C', explanation: 'Using the power rule: d/dx(xⁿ) = nxⁿ⁻¹, so d/dx(x²) = 2x.' },
    { subjectId: subjects['Mathematics'].id, question: 'Solve for x: 2x + 6 = 14', optionA: '3', optionB: '4', optionC: '5', optionD: '10', correctAnswer: 'B', explanation: '2x = 14 - 6 = 8, so x = 4.' },
    { subjectId: subjects['Mathematics'].id, question: 'What is the area of a circle with radius 7?', optionA: '49π', optionB: '14π', optionC: '7π', optionD: '21π', correctAnswer: 'A', explanation: 'Area = πr² = π(7²) = 49π.' },
    { subjectId: subjects['Mathematics'].id, question: 'What is log₁₀(1000)?', optionA: '2', optionB: '3', optionC: '4', optionD: '10', correctAnswer: 'B', explanation: 'log₁₀(1000) = log₁₀(10³) = 3.' },
    { subjectId: subjects['Mathematics'].id, question: 'What is the sum of interior angles of a triangle?', optionA: '90°', optionB: '270°', optionC: '360°', optionD: '180°', correctAnswer: 'D', explanation: 'The sum of interior angles of any triangle is always 180°.' },
    { subjectId: subjects['Mathematics'].id, question: 'If f(x) = 3x + 2, what is f(4)?', optionA: '10', optionB: '12', optionC: '14', optionD: '16', correctAnswer: 'C', explanation: 'f(4) = 3(4) + 2 = 12 + 2 = 14.' },
    { subjectId: subjects['Mathematics'].id, question: 'What is the LCM of 4 and 6?', optionA: '6', optionB: '8', optionC: '12', optionD: '24', correctAnswer: 'C', explanation: 'LCM(4,6) = 12 because 12 is the smallest number divisible by both 4 and 6.' },
    { subjectId: subjects['Mathematics'].id, question: 'What is √144?', optionA: '11', optionB: '12', optionC: '13', optionD: '14', correctAnswer: 'B', explanation: '12 × 12 = 144, so √144 = 12.' },
    { subjectId: subjects['Mathematics'].id, question: 'What is the slope of the line y = 4x - 3?', optionA: '-3', optionB: '4', optionC: '3', optionD: '-4', correctAnswer: 'B', explanation: 'In y = mx + b, m is the slope. Here m = 4.' },

    // Physics (10)
    { subjectId: subjects['Physics'].id, question: 'What is Newton\'s Second Law of Motion?', optionA: 'F = mv', optionB: 'F = ma', optionC: 'F = m/a', optionD: 'F = v/t', correctAnswer: 'B', explanation: 'Newton\'s Second Law states that Force = mass × acceleration (F = ma).' },
    { subjectId: subjects['Physics'].id, question: 'What is the SI unit of electric current?', optionA: 'Volt', optionB: 'Watt', optionC: 'Ampere', optionD: 'Ohm', correctAnswer: 'C', explanation: 'The SI unit of electric current is the Ampere (A).' },
    { subjectId: subjects['Physics'].id, question: 'What is the speed of light in a vacuum?', optionA: '3 × 10⁶ m/s', optionB: '3 × 10⁸ m/s', optionC: '3 × 10¹⁰ m/s', optionD: '3 × 10⁴ m/s', correctAnswer: 'B', explanation: 'The speed of light in a vacuum is approximately 3 × 10⁸ m/s.' },
    { subjectId: subjects['Physics'].id, question: 'Which law states that energy cannot be created or destroyed?', optionA: 'Newton\'s First Law', optionB: 'Ohm\'s Law', optionC: 'Law of Conservation of Energy', optionD: 'Boyle\'s Law', correctAnswer: 'C', explanation: 'The Law of Conservation of Energy states energy cannot be created or destroyed, only transformed.' },
    { subjectId: subjects['Physics'].id, question: 'What is the unit of resistance?', optionA: 'Ampere', optionB: 'Volt', optionC: 'Watt', optionD: 'Ohm', correctAnswer: 'D', explanation: 'Resistance is measured in Ohms (Ω), named after Georg Ohm.' },
    { subjectId: subjects['Physics'].id, question: 'What type of wave is sound?', optionA: 'Transverse', optionB: 'Electromagnetic', optionC: 'Longitudinal', optionD: 'Surface', correctAnswer: 'C', explanation: 'Sound is a longitudinal wave where particles vibrate parallel to the direction of propagation.' },
    { subjectId: subjects['Physics'].id, question: 'What is the acceleration due to gravity on Earth?', optionA: '8.9 m/s²', optionB: '9.8 m/s²', optionC: '10.8 m/s²', optionD: '11.2 m/s²', correctAnswer: 'B', explanation: 'The standard acceleration due to gravity on Earth is approximately 9.8 m/s².' },
    { subjectId: subjects['Physics'].id, question: 'Which phenomenon explains why the sky is blue?', optionA: 'Refraction', optionB: 'Reflection', optionC: 'Scattering', optionD: 'Diffraction', correctAnswer: 'C', explanation: 'The sky appears blue due to Rayleigh scattering of sunlight by atmospheric molecules.' },
    { subjectId: subjects['Physics'].id, question: 'What is the formula for kinetic energy?', optionA: 'KE = mgh', optionB: 'KE = ½mv²', optionC: 'KE = mv', optionD: 'KE = F × d', correctAnswer: 'B', explanation: 'Kinetic energy = ½ × mass × velocity², i.e., KE = ½mv².' },
    { subjectId: subjects['Physics'].id, question: 'What does a voltmeter measure?', optionA: 'Current', optionB: 'Resistance', optionC: 'Power', optionD: 'Voltage', correctAnswer: 'D', explanation: 'A voltmeter measures the electric potential difference (voltage) between two points.' },

    // Chemistry (5)
    { subjectId: subjects['Chemistry'].id, question: 'What is the atomic number of Carbon?', optionA: '4', optionB: '6', optionC: '8', optionD: '12', correctAnswer: 'B', explanation: 'Carbon has atomic number 6, meaning it has 6 protons in its nucleus.' },
    { subjectId: subjects['Chemistry'].id, question: 'What is the chemical formula of water?', optionA: 'HO', optionB: 'H₂O₂', optionC: 'H₂O', optionD: 'OH₂', correctAnswer: 'C', explanation: 'Water consists of 2 hydrogen atoms bonded to 1 oxygen atom: H₂O.' },
    { subjectId: subjects['Chemistry'].id, question: 'What is the pH of a neutral solution?', optionA: '0', optionB: '7', optionC: '14', optionD: '3', correctAnswer: 'B', explanation: 'A neutral solution has a pH of 7. Below 7 is acidic; above 7 is basic.' },
    { subjectId: subjects['Chemistry'].id, question: 'Which gas is produced during photosynthesis?', optionA: 'CO₂', optionB: 'N₂', optionC: 'O₂', optionD: 'H₂', correctAnswer: 'C', explanation: 'During photosynthesis, plants produce oxygen (O₂) as a by-product.' },
    { subjectId: subjects['Chemistry'].id, question: 'What is the most abundant gas in Earth\'s atmosphere?', optionA: 'Oxygen', optionB: 'Carbon Dioxide', optionC: 'Nitrogen', optionD: 'Argon', correctAnswer: 'C', explanation: 'Nitrogen (N₂) makes up approximately 78% of Earth\'s atmosphere.' },

    // Biology (5)
    { subjectId: subjects['Biology'].id, question: 'What is the powerhouse of the cell?', optionA: 'Nucleus', optionB: 'Ribosome', optionC: 'Mitochondria', optionD: 'Golgi Apparatus', correctAnswer: 'C', explanation: 'The mitochondria produce ATP (energy) through cellular respiration, earning the nickname "powerhouse of the cell".' },
    { subjectId: subjects['Biology'].id, question: 'Which blood type is the universal donor?', optionA: 'A', optionB: 'B', optionC: 'AB', optionD: 'O', correctAnswer: 'D', explanation: 'Type O- blood is the universal donor as it lacks A, B, and Rh antigens.' },
    { subjectId: subjects['Biology'].id, question: 'What molecule carries genetic information in cells?', optionA: 'RNA', optionB: 'DNA', optionC: 'ATP', optionD: 'Protein', correctAnswer: 'B', explanation: 'DNA (Deoxyribonucleic acid) stores and transmits genetic information.' },
    { subjectId: subjects['Biology'].id, question: 'How many chromosomes do human body cells have?', optionA: '23', optionB: '36', optionC: '46', optionD: '48', correctAnswer: 'C', explanation: 'Human somatic cells have 46 chromosomes (23 pairs).' },
    { subjectId: subjects['Biology'].id, question: 'What process do plants use to make food?', optionA: 'Respiration', optionB: 'Fermentation', optionC: 'Photosynthesis', optionD: 'Digestion', correctAnswer: 'C', explanation: 'Plants use photosynthesis to convert sunlight, CO₂, and water into glucose and oxygen.' },

    // English (5)
    { subjectId: subjects['English'].id, question: 'Which of the following is a synonym for "abundant"?', optionA: 'Scarce', optionB: 'Plentiful', optionC: 'Rare', optionD: 'Limited', correctAnswer: 'B', explanation: '"Abundant" means existing in large quantities. "Plentiful" is the closest synonym.' },
    { subjectId: subjects['English'].id, question: 'Choose the correctly punctuated sentence:', optionA: 'She said I am happy.', optionB: 'She said, "I am happy."', optionC: 'She said "I am happy".', optionD: 'She said: I am happy.', correctAnswer: 'B', explanation: 'Direct speech requires a comma after the reporting verb and quotation marks around the spoken words.' },
    { subjectId: subjects['English'].id, question: 'What is the past tense of "run"?', optionA: 'Runned', optionB: 'Runs', optionC: 'Ran', optionD: 'Running', correctAnswer: 'C', explanation: '"Ran" is the simple past tense of the irregular verb "run".' },
    { subjectId: subjects['English'].id, question: 'Which sentence uses the passive voice?', optionA: 'The dog bit the man.', optionB: 'The man was bitten by the dog.', optionC: 'The man ran from the dog.', optionD: 'A dog chased the man.', correctAnswer: 'B', explanation: 'Passive voice: subject receives the action. "The man was bitten" — man is the recipient.' },
    { subjectId: subjects['English'].id, question: 'What does the prefix "un-" mean?', optionA: 'Again', optionB: 'Before', optionC: 'Not', optionD: 'After', correctAnswer: 'C', explanation: 'The prefix "un-" means "not" (e.g., unhappy = not happy).' },

    // Economics (5)
    { subjectId: subjects['Economics'].id, question: 'What is the law of demand?', optionA: 'As price rises, demand rises', optionB: 'As price falls, demand falls', optionC: 'As price rises, demand falls', optionD: 'Demand is independent of price', correctAnswer: 'C', explanation: 'The law of demand states that as price increases, quantity demanded decreases, all else equal.' },
    { subjectId: subjects['Economics'].id, question: 'What is GDP?', optionA: 'Gross Domestic Price', optionB: 'General Development Plan', optionC: 'Gross Domestic Product', optionD: 'Government Development Policy', correctAnswer: 'C', explanation: 'GDP (Gross Domestic Product) is the total monetary value of all goods and services produced in a country.' },
    { subjectId: subjects['Economics'].id, question: 'Which type of economic system allows private ownership?', optionA: 'Communism', optionB: 'Capitalism', optionC: 'Planned economy', optionD: 'Feudalism', correctAnswer: 'B', explanation: 'In a capitalist system, individuals and businesses can own property and means of production.' },
    { subjectId: subjects['Economics'].id, question: 'What is inflation?', optionA: 'Decrease in money supply', optionB: 'General rise in price levels', optionC: 'Decrease in price levels', optionD: 'Increase in employment', correctAnswer: 'B', explanation: 'Inflation is the rate at which the general level of prices for goods and services rises over time.' },
    { subjectId: subjects['Economics'].id, question: 'What is opportunity cost?', optionA: 'The cost of production', optionB: 'The profit from a sale', optionC: 'The value of the next best forgone alternative', optionD: 'The price of a good', correctAnswer: 'C', explanation: 'Opportunity cost is the value of the next-best alternative you give up when making a choice.' },

    // History (5)
    { subjectId: subjects['History'].id, question: 'In which year did Ethiopia defeat Italy at the Battle of Adwa?', optionA: '1888', optionB: '1896', optionC: '1902', optionD: '1935', correctAnswer: 'B', explanation: 'Ethiopia defeated Italy at the Battle of Adwa on March 1, 1896, preserving its independence.' },
    { subjectId: subjects['History'].id, question: 'Who was the first Emperor of the Aksumite Empire?', optionA: 'Ezana', optionB: 'Lalibela', optionC: 'Menelik I', optionD: 'Tewodros II', correctAnswer: 'C', explanation: 'Menelik I is traditionally regarded as the founder of the Solomonic dynasty and the Aksumite Empire.' },
    { subjectId: subjects['History'].id, question: 'The OAU (Organization of African Unity) was founded in which city?', optionA: 'Nairobi', optionB: 'Cairo', optionC: 'Addis Ababa', optionD: 'Accra', correctAnswer: 'C', explanation: 'The OAU was founded in Addis Ababa, Ethiopia on May 25, 1963.' },
    { subjectId: subjects['History'].id, question: 'What document ended World War I?', optionA: 'Treaty of Paris', optionB: 'Treaty of Versailles', optionC: 'Treaty of Westphalia', optionD: 'Atlantic Charter', correctAnswer: 'B', explanation: 'World War I was formally ended by the Treaty of Versailles signed on June 28, 1919.' },
    { subjectId: subjects['History'].id, question: 'Who led the Haitian Revolution?', optionA: 'Simón Bolívar', optionB: 'Toussaint L\'Ouverture', optionC: 'Napoleon Bonaparte', optionD: 'George Washington', correctAnswer: 'B', explanation: 'Toussaint L\'Ouverture was the leader of the Haitian Revolution, which led to Haiti\'s independence in 1804.' },

    // Geography (5)
    { subjectId: subjects['Geography'].id, question: 'What is the longest river in Africa?', optionA: 'Congo', optionB: 'Zambezi', optionC: 'Niger', optionD: 'Nile', correctAnswer: 'D', explanation: 'The Nile River, stretching approximately 6,650 km, is the longest river in Africa.' },
    { subjectId: subjects['Geography'].id, question: 'What is the capital city of Ethiopia?', optionA: 'Dire Dawa', optionB: 'Gondar', optionC: 'Addis Ababa', optionD: 'Hawassa', correctAnswer: 'C', explanation: 'Addis Ababa is the capital and largest city of Ethiopia, meaning "New Flower" in Amharic.' },
    { subjectId: subjects['Geography'].id, question: 'Which continent has the most countries?', optionA: 'Asia', optionB: 'Europe', optionC: 'Africa', optionD: 'Americas', correctAnswer: 'C', explanation: 'Africa has 54 recognized countries, making it the continent with the most nations.' },
    { subjectId: subjects['Geography'].id, question: 'What is the largest ocean on Earth?', optionA: 'Atlantic', optionB: 'Indian', optionC: 'Arctic', optionD: 'Pacific', correctAnswer: 'D', explanation: 'The Pacific Ocean is the largest, covering more than 165 million km².' },
    { subjectId: subjects['Geography'].id, question: 'The Great Rift Valley runs through which continent?', optionA: 'South America', optionB: 'Asia', optionC: 'Africa', optionD: 'Australia', correctAnswer: 'C', explanation: 'The Great Rift Valley is a geological fault system running through eastern Africa, including Ethiopia.' },
  ];

  const createdQuestions = [];
  for (const q of questionData) {
    const created = await prisma.question.create({
      data: { ...q, teacherId: teacher.id },
    });
    createdQuestions.push(created);
  }

  console.log(`✅ ${createdQuestions.length} questions created`);

  // ─── Notes (5 sample PDF records) ─────────────────────────────────────────
  const noteData = [
    { subjectId: subjects['Mathematics'].id, title: 'Calculus Study Notes – Grade 12', description: 'Comprehensive notes covering limits, derivatives, integrals, and their applications.' },
    { subjectId: subjects['Physics'].id, title: 'Mechanics & Thermodynamics Review', description: 'Key concepts in classical mechanics, heat, and thermodynamics for exam preparation.' },
    { subjectId: subjects['Biology'].id, title: 'Cell Biology & Genetics Summary', description: 'Detailed review of cell structure, DNA, RNA, protein synthesis and inheritance.' },
    { subjectId: subjects['Economics'].id, title: 'Macroeconomics & Microeconomics Guide', description: 'Overview of supply and demand, market structures, GDP, inflation, and fiscal policy.' },
    { subjectId: subjects['History'].id, title: 'Ethiopian History – Modern Period', description: 'Study notes covering Ethiopian history from the 19th century to the present day.' },
  ];

  for (const n of noteData) {
    await prisma.note.create({
      data: { ...n, teacherId: teacher.id, pdfFile: 'sample-placeholder.pdf' },
    });
  }

  console.log('✅ Notes created');

  // ─── Mock Exams ────────────────────────────────────────────────────────────
  const mathQuestions = createdQuestions.filter(q => q.subjectId === subjects['Mathematics'].id);
  const physicsQuestions = createdQuestions.filter(q => q.subjectId === subjects['Physics'].id);

  const mathExam = await prisma.mockExam.create({
    data: {
      title: 'Mathematics National Exam Mock #1',
      subjectId: subjects['Mathematics'].id,
      durationMinutes: 45,
      numberOfQuestions: 10,
      teacherId: teacher.id,
      questions: {
        create: mathQuestions.map(q => ({ questionId: q.id })),
      },
    },
  });

  const physicsExam = await prisma.mockExam.create({
    data: {
      title: 'Physics National Exam Mock #1',
      subjectId: subjects['Physics'].id,
      durationMinutes: 45,
      numberOfQuestions: 10,
      teacherId: teacher.id,
      questions: {
        create: physicsQuestions.map(q => ({ questionId: q.id })),
      },
    },
  });

  console.log('✅ Mock exams created');

  // ─── Sample Student Attempt ─────────────────────────────────────────────────
  const answersPayload = mathQuestions.map((q, i) => ({
    questionId: q.id,
    selectedAnswer: q.correctAnswer,   // student got all correct for demo
    correctAnswer: q.correctAnswer,
    isCorrect: true,
  }));

  await prisma.attempt.create({
    data: {
      studentId: student.id,
      mockExamId: mathExam.id,
      score: 100,
      correctAnswers: 10,
      totalQuestions: 10,
      startedAt: new Date(Date.now() - 40 * 60 * 1000),
      submittedAt: new Date(),
      durationTaken: 2400,
      answers: { create: answersPayload },
    },
  });

  // Second attempt — partial score
  const partialAnswers = physicsQuestions.map((q, i) => {
    const isCorrect = i < 7;
    return {
      questionId: q.id,
      selectedAnswer: isCorrect ? q.correctAnswer : (q.correctAnswer === 'A' ? 'B' : 'A'),
      correctAnswer: q.correctAnswer,
      isCorrect,
    };
  });

  await prisma.attempt.create({
    data: {
      studentId: student.id,
      mockExamId: physicsExam.id,
      score: 70,
      correctAnswers: 7,
      totalQuestions: 10,
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 38 * 60 * 1000),
      durationTaken: 2280,
      answers: { create: partialAnswers },
    },
  });

  console.log('✅ Sample attempts created');
  console.log('\n🎉 Database seeded successfully!');
  console.log('─────────────────────────────────────');
  console.log('Admin:   admin@example.com   / Admin123!');
  console.log('Teacher: teacher@example.com / Teacher123!');
  console.log('Student: student@example.com / Student123!');
  console.log('─────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
