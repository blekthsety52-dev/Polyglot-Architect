
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectLanguage, AppType, ProjectSpec } from "../types";

export class GeminiService {
  // In accordance with @google/genai guidelines, GoogleGenAI is initialized
  // within each call to ensure it uses the freshest API key from the environment.

  async generateInitialSpec(
    language: ProjectLanguage,
    appType: AppType,
    description: string
  ): Promise<ProjectSpec> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Act as a world-class systems architect. Create a comprehensive project specification for a project with the following constraints:
    Language/Tech Stack: ${language}
    Application Type: ${appType}
    High-level Idea: ${description}

    Provide technical details on features, performance, testing, deployment, and recommended libraries.
    Crucially, provide a detailed ASCII folder structure for the project.
    Also, provide 3-5 high-quality code snippets (e.g., configuration, core logic, API handler) that demonstrate best practices for this specific stack.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            language: { type: Type.STRING },
            type: { type: Type.STRING },
            description: { type: Type.STRING },
            keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            performanceRequirements: { type: Type.STRING },
            testingStrategy: { type: Type.STRING },
            deploymentPlan: { type: Type.STRING },
            recommendedLibraries: { type: Type.ARRAY, items: { type: Type.STRING } },
            architectureOverview: { type: Type.STRING },
            folderStructure: { type: Type.STRING },
            codeSnippets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  language: { type: Type.STRING },
                  code: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "language", "code", "description"]
              }
            }
          },
          required: ["name", "language", "type", "description", "keyFeatures", "performanceRequirements", "testingStrategy", "deploymentPlan", "recommendedLibraries", "architectureOverview", "folderStructure", "codeSnippets"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Received empty response from the architecture engine.");
    }

    try {
      return JSON.parse(text) as ProjectSpec;
    } catch (e) {
      console.error("Failed to parse spec JSON", e);
      throw new Error("Failed to generate a valid project specification.");
    }
  }

  async generateProjectVisual(spec: ProjectSpec): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A futuristic, high-tech sci-fi artifact representing a software project. 
    Project Name: ${spec.name}
    Language: ${spec.language}
    Type: ${spec.type}
    The artifact is a miniature glowing holographic world or complex data core contained within a sleek, futuristic glass cylindrical canister with polished chrome top and bottom. 
    Inside the jar, there are visual elements representing ${spec.description}. 
    Cyberpunk aesthetic, dark obsidian background, glowing blue and violet neon accents, cinematic lighting, 4k, hyper-detailed. 
    Style: Glass jar vessel concept art.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to generate project visual.");
  }

  async refineSpec(
    currentSpec: ProjectSpec,
    userFeedback: string,
    history: { role: 'user' | 'model'; content: string }[]
  ): Promise<ProjectSpec> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `The user wants to refine this project specification.
    Current Spec: ${JSON.stringify(currentSpec)}
    User Request: ${userFeedback}
    
    Please provide an updated full specification based on this feedback. Use the same JSON structure.
    Keep the existing folderStructure and codeSnippets unless explicitly asked to change them, but ensure they are included in the response.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            language: { type: Type.STRING },
            type: { type: Type.STRING },
            description: { type: Type.STRING },
            keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            performanceRequirements: { type: Type.STRING },
            testingStrategy: { type: Type.STRING },
            deploymentPlan: { type: Type.STRING },
            recommendedLibraries: { type: Type.ARRAY, items: { type: Type.STRING } },
            architectureOverview: { type: Type.STRING },
            folderStructure: { type: Type.STRING },
            codeSnippets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  language: { type: Type.STRING },
                  code: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "language", "code", "description"]
              }
            }
          },
          required: ["name", "language", "type", "description", "keyFeatures", "performanceRequirements", "testingStrategy", "deploymentPlan", "recommendedLibraries", "architectureOverview", "folderStructure", "codeSnippets"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Received empty response during refinement.");
    }

    try {
      return JSON.parse(text) as ProjectSpec;
    } catch (e) {
      console.error("Failed to parse refined spec JSON", e);
      throw new Error("Failed to refine project specification.");
    }
  }
}
