import { useEffect, useRef } from "react";

interface CodeEditorProps {
  initial: string;
  onChange: (code: string) => void;
  /** Accessible label for the editor. */
  label: string;
}

/** A plain Python editor (CodeMirror 6), loaded on demand so the game bundle stays small. */
export function CodeEditor({ initial, onChange, label }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let destroyed = false;
    let view: { destroy: () => void } | undefined;
    void (async () => {
      const [{ EditorView, basicSetup }, { python }, { indentUnit }] = await Promise.all([
        import("codemirror"),
        import("@codemirror/lang-python"),
        import("@codemirror/language"),
      ]);
      if (destroyed || !host.current) return;
      view = new EditorView({
        doc: initial,
        parent: host.current,
        extensions: [
          basicSetup,
          python(),
          indentUnit.of("    "),
          EditorView.contentAttributes.of({ "aria-label": label, autocapitalize: "off", autocorrect: "off", spellcheck: "false" }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      });
    })();
    return () => {
      destroyed = true;
      view?.destroy();
    };
    // The editor owns its document after mounting; `initial` is only the starting text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="code-editor" ref={host} />;
}
