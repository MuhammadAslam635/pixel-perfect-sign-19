// import React, { useRef, useEffect, useMemo } from "react";
// import ReactQuill from "react-quill";
// import "quill/dist/quill.snow.css";
// import { cn } from "@/lib/utils";

// interface RichTextEditorProps {
//   value: string;
//   onChange: (value: string) => void;
//   placeholder?: string;
//   className?: string;
//   height?: string;
//   toolbar?: boolean;
//   readOnly?: boolean;
//   onFocus?: () => void;
// }

// export const RichTextEditor: React.FC<RichTextEditorProps> = ({
//   value,
//   onChange,
//   placeholder = "Start writing...",
//   className,
//   height = "120px",
//   toolbar = true,
//   readOnly = false,
//   onFocus,
// }) => {
//   const quillRef = useRef<ReactQuill>(null);

//   // Email-friendly toolbar configuration
//   const modules = useMemo(
//     () => ({
//       toolbar: toolbar
//         ? [
//             [{ header: [1, 2, 3, false] }],
//             ["bold", "italic", "underline", "strike"],
//             [{ list: "ordered" }, { list: "bullet" }],
//             [{ color: [] }, { background: [] }],
//           ]
//         : false,
//       clipboard: {
//         matchVisual: false,
//       },
//     }),
//     [toolbar]
//   );

//   const formats = useMemo(
//     () => [
//       "header",
//       "bold",
//       "italic",
//       "underline",
//       "strike",
//       "list",
//       "bullet",
//       "color",
//       "background",
//       "header",
//     ],
//     []
//   );

//   // Custom styles to match the existing theme
//   const editorStyles = {
//     color: "white",
//   };

//   const toolbarStyles = {
//     border: "none",
//     borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
//     borderTopLeftRadius: "8px",
//     borderTopRightRadius: "8px",
//   };

//   // Apply custom styles when component mounts
//   useEffect(() => {
//     if (quillRef.current) {
//       const quill = quillRef.current.getEditor();
//       const editor = quill.root;

//       // Apply styles to the editor container
//       Object.assign(editor.style, editorStyles);

//       // Style placeholder text and remove container borders
//       const placeholderStyle = document.createElement("style");
//       placeholderStyle.textContent = `
//         .ql-editor.ql-blank::before {
//           color: rgba(255, 255, 255, 0.4) !important;
//           opacity: 1 !important;
//         }
//         .ql-container.ql-snow {
//           border-bottom: none !important;
//           border-left: none !important;
//           border-right: none !important;
//         }
//         /* Hide scrollbars */
//         .ql-editor {
//           scrollbar-width: none; /* Firefox */
//           -ms-overflow-style: none; /* IE and Edge */
//           padding-bottom: 40px !important; /* Prevent text cutoff at bottom */
//         }
//         .ql-editor::-webkit-scrollbar {
//           display: none; /* Chrome, Safari, Opera */
//         }
//       `;
//       document.head.appendChild(placeholderStyle);

//       // Apply styles to toolbar if it exists
//       if (toolbar) {
//         const toolbarElement = quill.container.previousSibling as HTMLElement;
//         if (toolbarElement && toolbarElement.classList.contains("ql-toolbar")) {
//           Object.assign(toolbarElement.style, toolbarStyles);
//         }
//       }

//       // Style toolbar buttons
//       const toolbarButtons = quill.container.querySelectorAll(
//         ".ql-toolbar .ql-picker, .ql-toolbar .ql-stroke, .ql-toolbar .ql-fill"
//       );
//       toolbarButtons.forEach((button) => {
//         const element = button as HTMLElement;
//         element.style.color = "rgba(255, 255, 255, 0.7)";
//         element.style.stroke = "rgba(255, 255, 255, 0.7)";
//         element.style.fill = "rgba(255, 255, 255, 0.7)";
//       });

//       // Style toolbar button labels
//       const toolbarLabels = quill.container.querySelectorAll(
//         ".ql-toolbar .ql-picker-label"
//       );
//       toolbarLabels.forEach((label) => {
//         const element = label as HTMLElement;
//         element.style.color = "rgba(255, 255, 255, 0.7)";
//       });

//       // Style active toolbar buttons
//       const activeButtons = quill.container.querySelectorAll(
//         ".ql-toolbar .ql-active"
//       );
//       activeButtons.forEach((button) => {
//         const element = button as HTMLElement;
//         element.style.color = "cyan";
//         element.style.stroke = "cyan";
//         element.style.fill = "cyan";
//       });

//       // Add CSS for hover effects
//       const hoverStyle = document.createElement("style");
//       hoverStyle.textContent = `
//         .ql-toolbar .ql-formats button:hover,
//         .ql-toolbar .ql-picker:hover {
//           color: cyan !important;
//           stroke: cyan !important;
//           fill: cyan !important;
//           background-color: transparent !important;
//         }
//         .ql-toolbar .ql-formats button:hover .ql-stroke,
//         .ql-toolbar .ql-picker:hover .ql-stroke {
//           stroke: cyan !important;
//         }
//         .ql-toolbar .ql-formats button:hover .ql-fill,
//         .ql-toolbar .ql-picker:hover .ql-fill {
//           fill: cyan !important;
//         }
//         .ql-toolbar .ql-active {
//           color: cyan !important;
//           stroke: cyan !important;
//           fill: cyan !important;
//         }
//         .ql-toolbar .ql-active .ql-fill {
//           fill: cyan !important;
//           stroke: transparent !important;
//         }
        
//         /* Dropdown Styling */
//         .ql-picker-options {
//           background-color: #1a1a1a !important;
//           border: 1px solid rgba(255, 255, 255, 0.1) !important;
//           border-radius: 8px !important;
//           padding: 8px !important;
//           max-height: 200px !important;
//           overflow-y: auto !important;
//           scrollbar-width: thin;
//           scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
//           z-index: 1000 !important;
//         }
        
//         .ql-picker-item {
//           color: rgba(255, 255, 255, 0.7) !important;
//           padding: 4px 8px !important;
//           border-radius: 4px !important;
//         }
        
//         .ql-picker-item:hover {
//           background-color: rgba(255, 255, 255, 0.1) !important;
//           color: white !important;
//         }
        
//         .ql-picker-item.ql-selected {
//           color: cyan !important;
//           font-weight: bold !important;
//         }
        
//         /* Scrollbar for dropdown */
//         .ql-picker-options::-webkit-scrollbar {
//           width: 6px;
//         }
//         .ql-picker-options::-webkit-scrollbar-track {
//           background: transparent;
//         }
//         .ql-picker-options::-webkit-scrollbar-thumb {
//           background-color: rgba(255, 255, 255, 0.2);
//           border-radius: 3px;
//         }

//         /* Editor Height and Scrolling */
//         .ql-editor {
//           height: var(--editor-height) !important;
//           overflow-y: auto !important;
//           max-height: var(--editor-height) !important;
//         }
//       `;
//       document.head.appendChild(hoverStyle);
//     }
//   }, [toolbar]);

//   return (
//     <div
//       className={cn(
//         "rich-text-editor bg-transparent border-none rounded-lg",
//         className
//       )}
//       style={{ "--editor-height": height } as React.CSSProperties}
//     >
//       <ReactQuill
//         ref={quillRef}
//         theme={toolbar ? "snow" : "bubble"}
//         value={value}
//         onChange={onChange}
//         placeholder={placeholder}
//         modules={modules}
//         formats={formats}
//         readOnly={readOnly}
//         onFocus={onFocus}
//         style={{
//           backgroundColor: "transparent",
//           border: "none",
//           color: "white",
//         }}
//       />
//     </div>
//   );
// };

// export default RichTextEditor;

import React, { useRef, useEffect, useMemo } from "react";
import ReactQuill from "react-quill";
import "quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
  toolbar?: boolean;
  readOnly?: boolean;
  onFocus?: () => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing...",
  className,
  height = "120px",
  toolbar = true,
  readOnly = false,
  onFocus,
}) => {
  const quillRef = useRef<ReactQuill>(null);

  // Email-friendly toolbar configuration
  const modules = useMemo(
    () => ({
      toolbar: toolbar
        ? [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ color: [] }, { background: [] }],
          ]
        : false,
      clipboard: {
        matchVisual: false,
      },
    }),
    [toolbar]
  );

  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "bullet",
      "color",
      "background",
      "header",
    ],
    []
  );

  // Custom styles to match the existing theme
  const editorStyles = {
    color: "white",
  };

  const toolbarStyles = {
    border: "none",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
  };

  // Apply custom styles when component mounts
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const editor = quill.root;

      // Apply styles to the editor container
      Object.assign(editor.style, editorStyles);

      // Style placeholder text and remove container borders
      const placeholderStyle = document.createElement("style");
      placeholderStyle.textContent = `
        .ql-editor.ql-blank::before {
          color: rgba(255, 255, 255, 0.4) !important;
          opacity: 1 !important;
        }
        .ql-container.ql-snow {
          border-bottom: none !important;
          border-left: none !important;
          border-right: none !important;
        }
        /* Hide scrollbars */
        .ql-editor {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
          padding-bottom: 40px !important; /* Prevent text cutoff at bottom */
        }
        .ql-editor::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `;
      document.head.appendChild(placeholderStyle);

      // Apply styles to toolbar if it exists
      if (toolbar) {
        const toolbarElement = quill.container.previousSibling as HTMLElement;
        if (toolbarElement && toolbarElement.classList.contains("ql-toolbar")) {
          Object.assign(toolbarElement.style, toolbarStyles);
        }
      }

      // Style toolbar buttons
      const toolbarButtons = quill.container.querySelectorAll(
        ".ql-toolbar .ql-picker, .ql-toolbar .ql-stroke, .ql-toolbar .ql-fill"
      );
      toolbarButtons.forEach((button) => {
        const element = button as HTMLElement;
        element.style.color = "rgba(255, 255, 255, 0.7)";
        element.style.stroke = "rgba(255, 255, 255, 0.7)";
        element.style.fill = "rgba(255, 255, 255, 0.7)";
      });

      // Style toolbar button labels
      const toolbarLabels = quill.container.querySelectorAll(
        ".ql-toolbar .ql-picker-label"
      );
      toolbarLabels.forEach((label) => {
        const element = label as HTMLElement;
        element.style.color = "rgba(255, 255, 255, 0.7)";
      });

      // Style active toolbar buttons
      const activeButtons = quill.container.querySelectorAll(
        ".ql-toolbar .ql-active"
      );
      activeButtons.forEach((button) => {
        const element = button as HTMLElement;
        element.style.color = "cyan";
        element.style.stroke = "cyan";
        element.style.fill = "cyan";
      });

      // Add CSS for hover effects
      const hoverStyle = document.createElement("style");
      hoverStyle.textContent = `
        .ql-toolbar .ql-formats button:hover,
        .ql-toolbar .ql-picker:hover {
          color: cyan !important;
          stroke: cyan !important;
          fill: cyan !important;
          background-color: transparent !important;
        }
        .ql-toolbar .ql-formats button:hover .ql-stroke,
        .ql-toolbar .ql-picker:hover .ql-stroke {
          stroke: cyan !important;
        }
        .ql-toolbar .ql-formats button:hover .ql-fill,
        .ql-toolbar .ql-picker:hover .ql-fill {
          fill: cyan !important;
        }
        .ql-toolbar .ql-active {
          color: cyan !important;
          stroke: cyan !important;
          fill: cyan !important;
        }
        .ql-toolbar .ql-active .ql-fill {
          fill: cyan !important;
          stroke: transparent !important;
        }
        
        /* Dropdown Styling */
        .ql-picker-options {
          background-color: #1a1a1a !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          padding: 8px !important;
          max-height: 200px !important;
          overflow-y: auto !important;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
          z-index: 1000 !important;
        }
        
        .ql-picker-item {
          color: rgba(255, 255, 255, 0.7) !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
        }
        
        .ql-picker-item:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
        }
        
        .ql-picker-item.ql-selected {
          color: cyan !important;
          font-weight: bold !important;
        }
        
        /* Scrollbar for dropdown */
        .ql-picker-options::-webkit-scrollbar {
          width: 6px;
        }
        .ql-picker-options::-webkit-scrollbar-track {
          background: transparent;
        }
        .ql-picker-options::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        /* Editor Height and Scrolling */
        .ql-editor {
          height: var(--editor-height) !important;
          overflow-y: auto !important;
          max-height: var(--editor-height) !important;
        }
      `;
      document.head.appendChild(hoverStyle);
    }
  }, [toolbar]);

  return (
    <div
      className={cn(
        "rich-text-editor bg-transparent border-none rounded-lg",
        className
      )}
      style={{ "--editor-height": height } as React.CSSProperties}
    >
      <ReactQuill
        ref={quillRef}
        theme={toolbar ? "snow" : "bubble"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        readOnly={readOnly}
        onFocus={onFocus}
        style={{
          backgroundColor: "transparent",
          border: "none",
          color: "white",
        }}
      />
    </div>
  );
};

export default RichTextEditor;
