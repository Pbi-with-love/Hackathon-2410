export interface ParticipantProfile {
  name: string;
  bio: string;
  skills: Array<{ name: string; level: number }>;
  roles: string[];
  interests: string[];
  availability: { days: string[]; hours: string };
}

// Mock implementation — swap this function body for Gemini when API key is ready
export async function extractProfile(prompt: string): Promise<ParticipantProfile> {
  // Return a realistic mock that looks like it was extracted from the prompt
  // For now, return a hardcoded profile that roughly matches common hackathon participant prompts
  return {
    name: "Participant",
    bio: prompt.slice(0, 200),
    skills: [
      { name: "JavaScript", level: 3 },
      { name: "React", level: 3 },
      { name: "Node.js", level: 2 },
    ],
    roles: ["Frontend Developer"],
    interests: ["energy", "sustainability"],
    availability: { days: ["Saturday", "Sunday"], hours: "9:00-22:00" },
  };
}
