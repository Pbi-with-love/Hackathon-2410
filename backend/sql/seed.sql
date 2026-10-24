-- Seed data for Junction Community Matchmaker
-- All positions inside traced building polygons, distributed across 5 buildings:
--   Sahkotalo (hacking), Rakennustalo (mentors), Tietotalo (quiet),
--   Noodi (entrance/hall), Konetalo (food/hardware lab)
-- Password hash = "password123"

-- ============================================================
-- PARTICIPANTS (20) — 4 per building
-- ============================================================

INSERT INTO participants (id, name, email, password_hash, bio, skills, roles, interests, status, lat, lng) VALUES

-- Sahkotalo (4)
('a1000000-0000-0000-0000-000000000001', 'Aleksi Makinen',   'aleksi@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Frontend dev who loves React and clean UIs.',
  '["React","TypeScript","CSS"]', '{"frontend developer"}', '{"smart city","sustainability"}', 'looking', 61.49729, 23.75586),

('a1000000-0000-0000-0000-000000000003', 'Mikael Korhonen',  'mikael@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Backend engineer with Node.js and Postgres expertise.',
  '["Node.js","PostgreSQL","Docker"]', '{"backend developer"}', '{"fintech","smart city"}', 'looking', 61.49712, 23.75646),

('a1000000-0000-0000-0000-000000000011', 'Harri Lehtinen',   'harri@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Data scientist with expertise in time-series forecasting.',
  '["Python","pandas","scikit-learn"]', '{"data scientist"}', '{"energy","transport"}', 'looking', 61.49694, 23.75586),

('a1000000-0000-0000-0000-000000000017', 'Timo Hyvonen',     'timo@example.com',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'DevOps engineer who loves CI/CD and cloud cost optimisation.',
  '["Kubernetes","Terraform","AWS"]', '{"devops engineer"}', '{"smart city","transport"}', 'looking', 61.49722, 23.75641),

-- Rakennustalo (4)
('a1000000-0000-0000-0000-000000000005', 'Juhani Niemi',     'juhani@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'ML engineer specialising in NLP and recommendation systems.',
  '["Python","PyTorch","HuggingFace"]', '{"ml engineer"}', '{"health","education"}', 'looking', 61.49731, 23.75962),

('a1000000-0000-0000-0000-000000000006', 'Laura Heikkinen',  'laura@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Computer vision researcher with PyTorch and OpenCV experience.',
  '["Python","OpenCV","TensorFlow"]', '{"ml engineer","data scientist"}', '{"sustainability","smart city"}', 'looking', 61.49755, 23.76009),

('a1000000-0000-0000-0000-000000000015', 'Ville Turunen',    'ville@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Fullstack developer who enjoys building end-to-end features fast.',
  '["React","Node.js","PostgreSQL"]', '{"fullstack developer"}', '{"fintech","smart city"}', 'looking', 61.49727, 23.75942),

('a1000000-0000-0000-0000-000000000019', 'Oskari Leppanen',  'oskari@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Frontend dev passionate about data visualisation.',
  '["D3.js","React","WebGL"]', '{"frontend developer","data scientist"}', '{"energy","smart city"}', 'looking', 61.49734, 23.76021),

-- Tietotalo (4)
('a1000000-0000-0000-0000-000000000004', 'Sofia Leinonen',   'sofia@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Go and Rust backend developer interested in distributed systems.',
  '["Go","Rust","Kubernetes"]', '{"backend developer"}', '{"sustainability","transport"}', 'looking', 61.49794, 23.75085),

('a1000000-0000-0000-0000-000000000012', 'Miriam Ojala',     'miriam@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Data scientist focusing on geospatial analytics.',
  '["Python","GeoPandas","PostGIS"]', '{"data scientist","ml engineer"}', '{"smart city","sustainability"}', 'looking', 61.49784, 23.75095),

('a1000000-0000-0000-0000-000000000016', 'Niina Hamalainen', 'niina@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Full-stack with a product mindset; previously co-founded a startup.',
  '["Next.js","Prisma","tRPC"]', '{"fullstack developer","product manager"}', '{"education","health"}', 'looking', 61.49765, 23.75115),

('a1000000-0000-0000-0000-000000000020', 'Paula Lindqvist',  'paula@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Backend + ML engineer bridging data pipelines and product features.',
  '["Python","FastAPI","Redis"]', '{"backend developer","ml engineer"}', '{"health","fintech"}', 'looking', 61.49784, 23.75080),

-- Noodi (4)
('a1000000-0000-0000-0000-000000000002', 'Emma Virtanen',    'emma@example.com',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'UI/UX focused frontend developer, Figma enthusiast.',
  '["Vue","Figma","Tailwind"]', '{"frontend developer","ux designer"}', '{"health","education"}', 'looking', 61.49833, 23.75552),

('a1000000-0000-0000-0000-000000000007', 'Tuomas Jarvinen',  'tuomas@example.com',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'UX designer with strong user research background.',
  '["Figma","Prototyping","User Research"]', '{"ux designer"}', '{"health","social"}', 'looking', 61.49813, 23.75623),

('a1000000-0000-0000-0000-000000000009', 'Pekka Rantanen',   'pekka@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'PM with 3 years of B2B SaaS experience.',
  '["Roadmapping","Agile","Analytics"]', '{"product manager"}', '{"fintech","smart city"}', 'looking', 61.49825, 23.75596),

('a1000000-0000-0000-0000-000000000014', 'Kaisa Mattila',    'kaisa@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'React Native developer with UX sensibility.',
  '["React Native","TypeScript","Redux"]', '{"mobile developer","frontend developer"}', '{"gaming","social"}', 'looking', 61.49806, 23.75643),

-- Konetalo (4)
('a1000000-0000-0000-0000-000000000008', 'Anna Salonen',     'anna@example.com',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Product designer passionate about accessibility and inclusive design.',
  '["Figma","Design Systems","Accessibility"]', '{"ux designer","product manager"}', '{"education","social"}', 'looking', 61.49451, 23.75522),

('a1000000-0000-0000-0000-000000000010', 'Sanna Koskinen',   'sanna@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Growth PM focused on consumer apps and sustainability.',
  '["A/B Testing","SQL","OKRs"]', '{"product manager","data scientist"}', '{"sustainability","gaming"}', 'looking', 61.49432, 23.75522),

('a1000000-0000-0000-0000-000000000013', 'Risto Makela',     'risto@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'iOS and Android developer with Flutter expertise.',
  '["Flutter","Dart","Swift"]', '{"mobile developer"}', '{"health","social"}', 'looking', 61.49423, 23.75480),

('a1000000-0000-0000-0000-000000000018', 'Leena Aaltonen',   'leena@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2', 'Platform engineer with Helm, ArgoCD, and observability stacks.',
  '["Helm","ArgoCD","Prometheus"]', '{"devops engineer","backend developer"}', '{"sustainability","energy"}', 'looking', 61.49416, 23.75552)

ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- TEAMS (8) — 2 Sahkotalo, 2 Rakennustalo, 1 Tietotalo, 2 Noodi, 1 Konetalo
-- ============================================================

INSERT INTO teams (id, name, captain_id, challenge, project_idea, goals, needed_roles, status, lat, lng) VALUES

('b2000000-0000-0000-0000-000000000001',
 'SmartFlow', 'a1000000-0000-0000-0000-000000000003', 'Smart City',
 'Real-time traffic optimisation using edge IoT sensors and ML-driven signal control.',
 'Reduce average intersection wait time by 30% with adaptive signal timing.',
 '{"frontend developer","ml engineer","ux designer"}',
 'open', 61.49728, 23.75599),

('b2000000-0000-0000-0000-000000000002',
 'MindBridge', 'a1000000-0000-0000-0000-000000000005', 'Health Tech',
 'AI-powered mental health check-in app that detects early burnout signals via daily micro-surveys.',
 'Provide early warning scores with actionable tips and connect users to campus counsellors.',
 '{"mobile developer","ux designer","data scientist"}',
 'open', 61.49741, 23.75952),

('b2000000-0000-0000-0000-000000000003',
 'GreenGrid', 'a1000000-0000-0000-0000-000000000004', 'Sustainability',
 'Peer-to-peer renewable energy trading platform for residential solar panel owners.',
 'Enable neighbourhood energy sharing that reduces bills by 20% and CO2 by 15%.',
 '{"frontend developer","backend developer","product manager"}',
 'open', 61.49799, 23.75058),

('b2000000-0000-0000-0000-000000000004',
 'LearnLoop', 'a1000000-0000-0000-0000-000000000008', 'Education',
 'Adaptive learning platform that builds personalised curricula from open educational resources.',
 'Help university students reach their learning goals 40% faster via spaced repetition.',
 '{"ml engineer","backend developer","ux designer"}',
 'open', 61.49829, 23.75554),

('b2000000-0000-0000-0000-000000000005',
 'PayLite', 'a1000000-0000-0000-0000-000000000009', 'Fintech',
 'Micro-payment infrastructure for digital creators in emerging markets using stablecoin rails.',
 'Achieve sub-cent transaction fees with sub-second settlement for content creators.',
 '{"backend developer","fullstack developer","product manager"}',
 'open', 61.49710, 23.75638),

('b2000000-0000-0000-0000-000000000006',
 'QuestCity', 'a1000000-0000-0000-0000-000000000014', 'Gaming',
 'Location-based AR game that turns city exploration into collaborative city-building quests.',
 'Drive 10,000 monthly active players and partner with two city councils by end of year.',
 '{"mobile developer","frontend developer","ml engineer"}',
 'open', 61.49452, 23.75502),

('b2000000-0000-0000-0000-000000000007',
 'CareBridge', 'a1000000-0000-0000-0000-000000000016', 'Social Impact',
 'Platform connecting elderly residents with volunteer helpers for daily tasks and social contact.',
 'Match 500 elderly residents with volunteers in pilot city within six months.',
 '{"fullstack developer","ux designer","data scientist"}',
 'open', 61.49744, 23.76009),

('b2000000-0000-0000-0000-000000000008',
 'CarbonTrace', 'a1000000-0000-0000-0000-000000000011', 'Climate',
 'Supply-chain carbon footprint tracker that auto-pulls emissions data from logistics APIs.',
 'Give SMEs a real-time carbon dashboard and ISO-compliant report in under 10 minutes.',
 '{"backend developer","frontend developer","devops engineer"}',
 'open', 61.49816, 23.75619)

ON CONFLICT DO NOTHING;

-- ============================================================
-- MENTORS (6) — 1 per building + 1 extra in Rakennustalo
-- ============================================================

INSERT INTO mentors (id, name, email, password_hash, expertise, experience, status, lat, lng) VALUES

('c3000000-0000-0000-0000-000000000001',
 'Dr. Maria Svensson', 'maria.mentor@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2',
 '{"machine learning","computer vision","PyTorch"}',
 '10 years in ML research at Aalto University; shipped two production CV pipelines for industrial inspection.',
 'available', 61.49724, 23.75972),

('c3000000-0000-0000-0000-000000000002',
 'James O''Connor', 'james.mentor@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2',
 '{"web development","React","Node.js","TypeScript"}',
 'Staff engineer at a Series B fintech; built scalable Node.js microservices serving 1M+ users.',
 'available', 61.49694, 23.75589),

('c3000000-0000-0000-0000-000000000003',
 'Yuki Tanaka', 'yuki.mentor@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2',
 '{"mobile development","iOS","Android","Flutter"}',
 '8 years building mobile apps; 3 apps with 100k+ downloads on App Store and Google Play.',
 'available', 61.49829, 23.75584),

('c3000000-0000-0000-0000-000000000004',
 'Priya Nair', 'priya.mentor@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2',
 '{"data engineering","Apache Spark","Kafka","dbt"}',
 'Principal data engineer at a logistics unicorn; designed petabyte-scale event streaming pipelines.',
 'busy', 61.49437, 23.75532),

('c3000000-0000-0000-0000-000000000005',
 'Clara Fontaine', 'clara.mentor@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2',
 '{"UX research","design systems","Figma","accessibility"}',
 'Lead UX researcher at a healthtech startup; runs usability labs and ships design systems used by 40 engineers.',
 'available', 61.49771, 23.75095),

('c3000000-0000-0000-0000-000000000006',
 'Antti Valimaki', 'antti.mentor@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMsAkgzCg2',
 '{"cloud infrastructure","Kubernetes","Terraform","AWS","observability"}',
 'Senior SRE at a Nordic cloud consultancy; manages multi-cluster K8s environments and mentors DevOps teams.',
 'away', 61.49735, 23.76023)

ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- TEAM MEMBERS
-- ============================================================

INSERT INTO team_members (team_id, participant_id) VALUES
('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001'),
('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006'),
('b2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000011'),
('b2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000007'),
('b2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000015'),
('b2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000013'),
('b2000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000010'),
('b2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000018'),
('b2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000019')
ON CONFLICT DO NOTHING;
