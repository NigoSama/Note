import { GoogleGenAI, Type } from "@google/genai";
import { MindMapNodeData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-2.5-flash';

export const generateMindMap = async (topic: string): Promise<MindMapNodeData> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Create a hierarchical mind map about "${topic}". Return a JSON object representing the root node with a 'label' and a 'children' array. Ensure the structure is roughly 3 levels deep.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            label: { type: Type.STRING },
            children: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  children: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                         id: { type: Type.STRING },
                         label: { type: Type.STRING },
                         children: { 
                             type: Type.ARRAY, 
                             items: { 
                                 type: Type.OBJECT, 
                                 properties: {
                                     id: { type: Type.STRING },
                                     label: { type: Type.STRING }
                                 } 
                             } 
                         } 
                      }
                    }
                  },
                },
              },
            },
          },
          required: ["id", "label", "children"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as MindMapNodeData;
  } catch (error) {
    console.error("Mind map generation failed", error);
    // Fallback structure
    return {
      id: 'root',
      label: topic,
      children: [
        { id: '1', label: 'Error generating map', children: [] },
        { id: '2', label: 'Try again', children: [] }
      ]
    };
  }
};

export const generateTableData = async (topic: string): Promise<string[][]> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Create a comprehensive comparison table about "${topic}". Return a 2D JSON array (array of arrays of strings). The first row should be headers. Generate 4-6 rows and 3-4 columns.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as string[][];
  } catch (error) {
    console.error("Table generation failed", error);
    return [
      ["Header 1", "Header 2"],
      ["Data A", "Data B"],
      ["Data C", "Data D"]
    ];
  }
};

export const enhanceText = async (currentText: string, instruction: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `The user has written: "${currentText}". ${instruction}. Return only the resulting text.`,
        });
        return response.text || currentText;
    } catch (e) {
        console.error("Text enhancement failed", e);
        return currentText;
    }
}