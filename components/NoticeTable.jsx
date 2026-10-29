import { columnInfo, totalsRow } from "@/lib/noticeTable";

const LINE = "1px solid #000";

export default function NoticeTable({ t }) {
  const info = columnInfo(t);
  const total = t.showTotal ? totalsRow(t, info) : null;

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: info.map((c) => `${c.weight}fr`).join(" "),
    breakInside: "avoid",
  };
  const cell = (i, align) => ({
    borderRight: LINE,
    borderBottom: LINE,
    padding: "3px 6px",
    minWidth: 0,
    minHeight: "1.5em",
    textAlign: align ?? info[i].align,
    overflowWrap: "anywhere",
  });

  return (
    <div style={{ margin: "10px 0", fontSize: 14, lineHeight: 1.5 }}>
      {t.title && (
        <p
          className="mb-1 font-bold text-center"
          style={{ breakAfter: "avoid" }}
        >
          {t.title}
        </p>
      )}
      <div
        role="table"
        aria-label={t.title || "টেবিল"}
        style={{ borderTop: LINE, borderLeft: LINE }}
      >
        <div
          role="row"
          style={{
            ...rowStyle,
            background: "#e9eef4",
            fontWeight: 700,
            breakAfter: "avoid",
          }}
        >
          {t.columns.map((c, i) => (
            <div role="columnheader" key={i} style={cell(i, "center")}>
              {c}
            </div>
          ))}
        </div>

        {t.rows.map((r, ri) => (
          <div role="row" key={ri} style={rowStyle}>
            {r.map((c, i) => (
              <div role="cell" key={i} style={cell(i)}>
                {c}
              </div>
            ))}
          </div>
        ))}

        {total && (
          <div
            role="row"
            style={{ ...rowStyle, background: "#f3f4f6", fontWeight: 700 }}
          >
            {total.map((c, i) => (
              <div
                role="cell"
                key={i}
                style={cell(i, i === 0 ? "left" : undefined)}
              >
                {c}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
