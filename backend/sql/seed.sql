-- Seed data for Junction Community Matchmaker
-- All lat/lng near Tampere University (61.4978° N, 23.7610° E), ±0.003°
-- Password hash represents "password123": $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2

-- ============================================================
-- PARTICIPANTS (20)
-- ============================================================

INSERT INTO participants (id, name, email, password_hash, bio, skills, roles, interests, status, lat, lng) VALUES

-- Frontend devs
('a1000000-0000-0000-0000-000000000001', 'Aleksi Mäkinen',   'aleksi@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Frontend dev who loves React and clean UIs.',
  '["React","TypeScript","CSS"]', '{"frontend developer"}', '{"smart city","sustainability"}', 'looking', 61.4991, 23.7625),

('a1000000-0000-0000-0000-000000000002', 'Emma Virtanen',    'emma@example.com',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'UI/UX focused frontend developer, Figma enthusiast.',
  '["Vue","Figma","Tailwind"]', '{"frontend developer","ux designer"}', '{"health","education"}', 'looking', 61.4975, 23.7598),

-- Backend devs
('a1000000-0000-0000-0000-000000000003', 'Mikael Korhonen',  'mikael@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Backend engineer with Node.js and Postgres expertise.',
  '["Node.js","PostgreSQL","Docker"]', '{"backend developer"}', '{"fintech","smart city"}', 'looking', 61.4982, 23.7635),

('a1000000-0000-0000-0000-000000000004', 'Sofia Leinonen',   'sofia@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Go and Rust backend developer interested in distributed systems.',
  '["Go","Rust","Kubernetes"]', '{"backend developer"}', '{"sustainability","transport"}', 'looking', 61.4970, 23.7605),

-- ML engineers
('a1000000-0000-0000-0000-000000000005', 'Juhani Niemi',     'juhani@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'ML engineer specialising in NLP and recommendation systems.',
  '["Python","PyTorch","HuggingFace"]', '{"ml engineer"}', '{"health","education"}', 'looking', 61.4995, 23.7615),

('a1000000-0000-0000-0000-000000000006', 'Laura Heikkinen',  'laura@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Computer vision researcher with PyTorch and OpenCV experience.',
  '["Python","OpenCV","TensorFlow"]', '{"ml engineer","data scientist"}', '{"sustainability","smart city"}', 'looking', 61.4967, 23.7622),

-- UX designers
('a1000000-0000-0000-0000-000000000007', 'Tuomas Järvinen',  'tuomas@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'UX designer with strong user research background.',
  '["Figma","Prototyping","User Research"]', '{"ux designer"}', '{"health","social"}', 'looking', 61.4989, 23.7595),

('a1000000-0000-0000-0000-000000000008', 'Anna Salonen',     'anna@example.com',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Product designer passionate about accessibility and inclusive design.',
  '["Figma","Design Systems","Accessibility"]', '{"ux designer","product manager"}', '{"education","social"}', 'looking', 61.4984, 23.7642),

-- Product managers
('a1000000-0000-0000-0000-000000000009', 'Pekka Rantanen',   'pekka@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'PM with 3 years of B2B SaaS experience.',
  '["Roadmapping","Agile","Analytics"]', '{"product manager"}', '{"fintech","smart city"}', 'looking', 61.4978, 23.7601),

('a1000000-0000-0000-0000-000000000010', 'Sanna Koskinen',   'sanna@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Growth PM focused on consumer apps and sustainability.',
  '["A/B Testing","SQL","OKRs"]', '{"product manager","data scientist"}', '{"sustainability","gaming"}', 'looking', 61.4974, 23.7618),

-- Data scientists
('a1000000-0000-0000-0000-000000000011', 'Harri Lehtinen',   'harri@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Data scientist with expertise in time-series forecasting.',
  '["Python","pandas","scikit-learn"]', '{"data scientist"}', '{"energy","transport"}', 'looking', 61.4993, 23.7609),

('a1000000-0000-0000-0000-000000000012', 'Miriam Ojala',     'miriam@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Data scientist focusing on geospatial analytics.',
  '["Python","GeoPandas","PostGIS"]', '{"data scientist","ml engineer"}', '{"smart city","sustainability"}', 'looking', 61.4968, 23.7631),

-- Mobile devs
('a1000000-0000-0000-0000-000000000013', 'Risto Mäkelä',     'risto@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'iOS and Android developer with Flutter expertise.',
  '["Flutter","Dart","Swift"]', '{"mobile developer"}', '{"health","social"}', 'looking', 61.4987, 23.7647),

('a1000000-0000-0000-0000-000000000014', 'Kaisa Mattila',    'kaisa@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'React Native developer with UX sensibility.',
  '["React Native","TypeScript","Redux"]', '{"mobile developer","frontend developer"}', '{"gaming","social"}', 'looking', 61.4972, 23.7593),

-- Fullstack devs
('a1000000-0000-0000-0000-000000000015', 'Ville Turunen',    'ville@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Fullstack developer who enjoys building end-to-end features fast.',
  '["React","Node.js","PostgreSQL"]', '{"fullstack developer"}', '{"fintech","smart city"}', 'looking', 61.4980, 23.7627),

('a1000000-0000-0000-0000-000000000016', 'Niina Hämäläinen', 'niina@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Full-stack with a product mindset; previously co-founded a startup.',
  '["Next.js","Prisma","tRPC"]', '{"fullstack developer","product manager"}', '{"education","health"}', 'looking', 61.4963, 23.7611),

-- DevOps engineers
('a1000000-0000-0000-0000-000000000017', 'Timo Hyvönen',     'timo@example.com',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'DevOps engineer who loves CI/CD and cloud cost optimisation.',
  '["Kubernetes","Terraform","AWS"]', '{"devops engineer"}', '{"smart city","transport"}', 'looking', 61.4997, 23.7604),

('a1000000-0000-0000-0000-000000000018', 'Leena Aaltonen',   'leena@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Platform engineer with Helm, ArgoCD, and observability stacks.',
  '["Helm","ArgoCD","Prometheus"]', '{"devops engineer","backend developer"}', '{"sustainability","energy"}', 'looking', 61.4966, 23.7638),

-- Extra frontend / fullstack
('a1000000-0000-0000-0000-000000000019', 'Oskari Leppänen',  'oskari@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Frontend dev passionate about data visualisation.',
  '["D3.js","React","WebGL"]', '{"frontend developer","data scientist"}', '{"energy","smart city"}', 'looking', 61.4985, 23.7617),

('a1000000-0000-0000-0000-000000000020', 'Paula Lindqvist',  'paula@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Backend + ML engineer bridging data pipelines and product features.',
  '["Python","FastAPI","Redis"]', '{"backend developer","ml engineer"}', '{"health","fintech"}', 'looking', 61.4977, 23.7643)

ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- TEAMS (8)
-- ============================================================

INSERT INTO teams (id, name, captain_id, challenge, project_idea, goals, needed_roles, status, lat, lng) VALUES

('b2000000-0000-0000-0000-000000000001',
 'SmartFlow',
 'a1000000-0000-0000-0000-000000000003',
 'Smart City',
 'Real-time traffic optimisation using edge IoT sensors and ML-driven signal control.',
 'Reduce average intersection wait time by 30% with adaptive signal timing.',
 '{"frontend developer","ml engineer","ux designer"}',
 'open', 61.4983, 23.7621),

('b2000000-0000-0000-0000-000000000002',
 'MindBridge',
 'a1000000-0000-0000-0000-000000000005',
 'Health Tech',
 'AI-powered mental health check-in app that detects early burnout signals via daily micro-surveys.',
 'Provide early warning scores with actionable tips and connect users to campus counsellors.',
 '{"mobile developer","ux designer","data scientist"}',
 'open', 61.4969, 23.7607),

('b2000000-0000-0000-0000-000000000003',
 'GreenGrid',
 'a1000000-0000-0000-0000-000000000004',
 'Sustainability',
 'Peer-to-peer renewable energy trading platform for residential solar panel owners.',
 'Enable neighbourhood energy sharing that reduces bills by 20% and CO₂ by 15%.',
 '{"frontend developer","backend developer","product manager"}',
 'open', 61.4991, 23.7634),

('b2000000-0000-0000-0000-000000000004',
 'LearnLoop',
 'a1000000-0000-0000-0000-000000000008',
 'Education',
 'Adaptive learning platform that builds personalised curricula from open educational resources.',
 'Help university students reach their learning goals 40% faster via spaced repetition.',
 '{"ml engineer","backend developer","ux designer"}',
 'open', 61.4976, 23.7599),

('b2000000-0000-0000-0000-000000000005',
 'PayLite',
 'a1000000-0000-0000-0000-000000000009',
 'Fintech',
 'Micro-payment infrastructure for digital creators in emerging markets using stablecoin rails.',
 'Achieve sub-cent transaction fees with sub-second settlement for content creators.',
 '{"backend developer","fullstack developer","product manager"}',
 'open', 61.4960, 23.7612),

('b2000000-0000-0000-0000-000000000006',
 'QuestCity',
 'a1000000-0000-0000-0000-000000000014',
 'Gaming',
 'Location-based AR game that turns city exploration into collaborative city-building quests.',
 'Drive 10,000 monthly active players and partner with two city councils by end of year.',
 '{"mobile developer","frontend developer","ml engineer"}',
 'open', 61.4988, 23.7640),

('b2000000-0000-0000-0000-000000000007',
 'CareBridge',
 'a1000000-0000-0000-0000-000000000016',
 'Social Impact',
 'Platform connecting elderly residents with volunteer helpers for daily tasks and social contact.',
 'Match 500 elderly residents with volunteers in pilot city within six months.',
 '{"fullstack developer","ux designer","data scientist"}',
 'open', 61.4973, 23.7596),

('b2000000-0000-0000-0000-000000000008',
 'CarbonTrace',
 'a1000000-0000-0000-0000-000000000011',
 'Climate',
 'Supply-chain carbon footprint tracker that auto-pulls emissions data from logistics APIs.',
 'Give SMEs a real-time carbon dashboard and ISO-compliant report in under 10 minutes.',
 '{"backend developer","frontend developer","devops engineer"}',
 'open', 61.4964, 23.7629)

ON CONFLICT DO NOTHING;

-- ============================================================
-- MENTORS (6)
-- ============================================================

INSERT INTO mentors (id, name, email, password_hash, expertise, experience, status, lat, lng) VALUES

('c3000000-0000-0000-0000-000000000001',
 'Dr. Maria Svensson',
 'maria.mentor@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2',
 '{"machine learning","computer vision","PyTorch"}',
 '10 years in ML research at Aalto University; shipped two production CV pipelines for industrial inspection.',
 'available', 61.4980, 23.7608),

('c3000000-0000-0000-0000-000000000002',
 'James O''Connor',
 'james.mentor@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2',
 '{"web development","React","Node.js","TypeScript"}',
 'Staff engineer at a Series B fintech; built scalable Node.js microservices serving 1M+ users.',
 'available', 61.4994, 23.7620),

('c3000000-0000-0000-0000-000000000003',
 'Yuki Tanaka',
 'yuki.mentor@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2',
 '{"mobile development","iOS","Android","Flutter"}',
 '8 years building mobile apps; 3 apps with 100k+ downloads on App Store and Google Play.',
 'available', 61.4965, 23.7615),

('c3000000-0000-0000-0000-000000000004',
 'Priya Nair',
 'priya.mentor@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2',
 '{"data engineering","Apache Spark","Kafka","dbt"}',
 'Principal data engineer at a logistics unicorn; designed petabyte-scale event streaming pipelines.',
 'available', 61.4986, 23.7633),

('c3000000-0000-0000-0000-000000000005',
 'Clara Fontaine',
 'clara.mentor@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2',
 '{"UX research","design systems","Figma","accessibility"}',
 'Lead UX researcher at a healthtech startup; runs usability labs and ships design systems used by 40 engineers.',
 'available', 61.4971, 23.7601),

('c3000000-0000-0000-0000-000000000006',
 'Antti Välimäki',
 'antti.mentor@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2',
 '{"cloud infrastructure","Kubernetes","Terraform","AWS","observability"}',
 'Senior SRE at a Nordic cloud consultancy; manages multi-cluster K8s environments and mentors DevOps teams.',
 'available', 61.4959, 23.7624)

ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- TEAM MEMBERS (9 rows — some teams already have 1-2 members)
-- ============================================================

INSERT INTO team_members (team_id, participant_id) VALUES

-- SmartFlow: captain (mikael) + aleksi
('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001'),

-- MindBridge: captain (juhani) + laura
('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006'),

-- GreenGrid: captain (sofia) + harri
('b2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000011'),

-- LearnLoop: captain (anna) + tuomas
('b2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000007'),

-- PayLite: captain (pekka) + ville
('b2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000015'),

-- QuestCity: captain (kaisa) + risto
('b2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000013'),

-- CareBridge: captain (niina) + sanna
('b2000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000010'),

-- CarbonTrace: captain (harri) + leena
('b2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000018'),

-- CarbonTrace also has oskari
('b2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000019')

ON CONFLICT DO NOTHING;
