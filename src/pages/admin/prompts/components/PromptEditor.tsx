import { useEffect, useMemo, useState, useCallback } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./quill-theme.css";

interface PromptEditorProps {
    value: string;
    onChange: (val: string) => void;
    isEditing: boolean;
    promptKey: string;
}

export const PromptEditor = ({
    value,
    onChange,
    isEditing,
    promptKey,
}: PromptEditorProps) => {
    const [quillValue, setQuillValue] = useState("");

    const quillModules = useMemo(
        () => ({
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["code-block", "blockquote"],
                ["link"],
                ["clean"],
            ],
        }),
        []
    );

    const quillFormats = [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "list",
        "bullet",
        "code-block",
        "blockquote",
        "link",
    ];

    const htmlToPlainText = useCallback((html: string) => {
        if (!html || html === "<p><br></p>") return "";

        const div = document.createElement("div");
        div.innerHTML = html;

        div.querySelectorAll("p, li, blockquote").forEach((el) => {
            el.replaceWith(document.createTextNode("\n" + (el.textContent || "")));
        });

        div.querySelectorAll("br").forEach((br) =>
            br.replaceWith(document.createTextNode("\n"))
        );

        return (div.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
    }, []);

    const plainTextToHtml = useCallback((text: string) => {
        if (!text) return "";
        return text
            .split("\n")
            .map((l) => `<p>${l || "<br>"}</p>`)
            .join("");
    }, []);

    useEffect(() => {
        setQuillValue(plainTextToHtml(value));
    }, [value, plainTextToHtml]);

    return (
        <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
            <ReactQuill
                key={promptKey + (isEditing ? "-edit" : "-new")}
                theme="snow"
                value={quillValue}
                modules={quillModules}
                formats={quillFormats}
                onChange={(val) => {
                    setQuillValue(val);
                    onChange(htmlToPlainText(val));
                }}
                placeholder="Enter prompt content..."
                className="prompt-quill"
            />
        </div>
    );
};
