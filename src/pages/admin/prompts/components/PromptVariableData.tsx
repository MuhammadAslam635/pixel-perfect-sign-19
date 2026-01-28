import { type PromptType } from "@/services/connectionMessages.service";
export interface Variable {
    name: string;
    description: string;
    example: string;
    category: string;
}
export const variablesByType: Record<PromptType, Variable[]> = {
    email: [
        {
            name: "{{person.name}}",
            description: "Recipient's full name",
            example: "John Doe",
            category: "Person",
        },
        {
            name: "{{person.firstName}}",
            description: "Recipient's first name",
            example: "John",
            category: "Person",
        },
        {
            name: "{{person.position}}",
            description: "Recipient's job title/position",
            example: "CEO",
            category: "Person",
        },
        {
            name: "{{person.email}}",
            description: "Recipient's email address",
            example: "john@example.com",
            category: "Person",
        },
        {
            name: "{{person.location}}",
            description: "Recipient's location",
            example: "New York, NY",
            category: "Person",
        },
        {
            name: "{{person.description}}",
            description: "Recipient's bio/description",
            example: "Experienced executive...",
            category: "Person",
        },
        {
            name: "{{company.name}}",
            description: "Company name",
            example: "TechCorp Inc.",
            category: "Company",
        },
        {
            name: "{{company.industry}}",
            description: "Company industry",
            example: "Technology",
            category: "Company",
        },
        {
            name: "{{company.description}}",
            description: "Company description/about",
            example: "Leading tech company...",
            category: "Company",
        },
        {
            name: "{{company.website}}",
            description: "Company website URL",
            example: "https://techcorp.com",
            category: "Company",
        },
        {
            name: "{{context}}",
            description: "Brand context and knowledge base",
            example: "Your brand information...",
            category: "Context",
        },
        {
            name: "{{tone}}",
            description: "Email tone (professional, friendly, casual)",
            example: "professional",
            category: "Email Settings",
        },
        {
            name: "{{emailType}}",
            description: "Email type (introduction, follow_up, etc.)",
            example: "introduction",
            category: "Email Settings",
        },
        {
            name: "{{length}}",
            description: "Email length (short, medium, long)",
            example: "medium",
            category: "Email Settings",
        },
        {
            name: "{{userSignature}}",
            description: "User signature (plain text)",
            example: "Best regards,\nJohn",
            category: "Signature",
        },
        {
            name: "{{userSignatureHtml}}",
            description: "User signature (HTML format)",
            example: "<p>Best regards,<br>John</p>",
            category: "Signature",
        },
    ],
    linkedin: [
        {
            name: "{{person.name}}",
            description: "Person's full name",
            example: "John Doe",
            category: "Person",
        },
        {
            name: "{{person.position}}",
            description: "Person's job title",
            example: "CEO",
            category: "Person",
        },
        {
            name: "{{person.companyName}}",
            description: "Person's company name",
            example: "TechCorp Inc.",
            category: "Person",
        },
        {
            name: "{{person.location}}",
            description: "Person's location",
            example: "New York, NY",
            category: "Person",
        },
        {
            name: "{{person.description}}",
            description: "Person's LinkedIn description",
            example: "Experienced executive...",
            category: "Person",
        },
        {
            name: "{{company.name}}",
            description: "Target company name",
            example: "TechCorp Inc.",
            category: "Company",
        },
        {
            name: "{{company.industry}}",
            description: "Company industry",
            example: "Technology",
            category: "Company",
        },
        {
            name: "{{company.description}}",
            description: "Company description",
            example: "Leading tech company...",
            category: "Company",
        },
        {
            name: "{{company.website}}",
            description: "Company website",
            example: "https://techcorp.com",
            category: "Company",
        },
        {
            name: "{{context}}",
            description: "Brand context and knowledge base",
            example: "Your brand information...",
            category: "Context",
        },
        {
            name: "{{tone}}",
            description: "Message tone",
            example: "professional",
            category: "Settings",
        },
    ],
    phone: [
        {
            name: "{{person.name}}",
            description: "Prospect's full name",
            example: "John Doe",
            category: "Person",
        },
        {
            name: "{{person.position}}",
            description: "Prospect's job title",
            example: "CEO",
            category: "Person",
        },
        {
            name: "{{company.name}}",
            description: "Company name",
            example: "TechCorp Inc.",
            category: "Company",
        },
        {
            name: "{{company.industry}}",
            description: "Company industry",
            example: "Technology",
            category: "Company",
        },
        {
            name: "{{company.description}}",
            description: "Company description",
            example: "Leading tech company...",
            category: "Company",
        },
        {
            name: "{{person.location}}",
            description: "Prospect's location",
            example: "New York, NY",
            category: "Person",
        },
        {
            name: "{{callerContext}}",
            description: "Caller information (your name, company)",
            example: "Your Name, Your Company",
            category: "Caller",
        },
        {
            name: "{{callObjective}}",
            description: "Call objective/purpose",
            example: "introduction",
            category: "Call Settings",
        },
        {
            name: "{{scriptLength}}",
            description: "Script length (short, medium, long)",
            example: "medium",
            category: "Call Settings",
        },
        {
            name: "{{length.intro}}",
            description: "Introduction duration",
            example: "30 seconds",
            category: "Call Settings",
        },
        {
            name: "{{length.total}}",
            description: "Total script duration",
            example: "2-3 minutes",
            category: "Call Settings",
        },
        {
            name: "{{brandContext}}",
            description: "Brand context and knowledge base",
            example: "Your brand information...",
            category: "Context",
        },
        {
            name: "{{additionalInstructions}}",
            description: "Custom call instructions",
            example: "Focus on pricing...",
            category: "Call Settings",
        },
    ],
    whatsapp: [
        {
            name: "{{person.name}}",
            description: "Recipient's full name",
            example: "John Doe",
            category: "Person",
        },
        {
            name: "{{person.firstName}}",
            description: "Recipient's first name",
            example: "John",
            category: "Person",
        },
        {
            name: "{{person.position}}",
            description: "Recipient's job title",
            example: "CEO",
            category: "Person",
        },
        {
            name: "{{person.phone}}",
            description: "Recipient's phone number",
            example: "+1234567890",
            category: "Person",
        },
        {
            name: "{{company.name}}",
            description: "Company name",
            example: "TechCorp Inc.",
            category: "Company",
        },
        {
            name: "{{company.industry}}",
            description: "Company industry",
            example: "Technology",
            category: "Company",
        },
        {
            name: "{{context}}",
            description: "Brand context and knowledge base",
            example: "Your brand information...",
            category: "Context",
        },
        {
            name: "{{tone}}",
            description: "Message tone",
            example: "friendly",
            category: "Settings",
        },
    ],
};