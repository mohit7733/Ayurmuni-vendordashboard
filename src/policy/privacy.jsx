import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Shield,
} from "lucide-react";
import logo from "../Assests/logo/short_logo.svg";
import { getLegalPolicy } from "../services/policyService";

const POLICY_TYPE = "privacy_policy";

function slugify(text, index) {
  const slug = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `section-${index}-${slug}` : `section-${index}`;
}

function visibleContent(content, policy) {
  let skippedTitle = false;
  let skippedSubtitle = false;
  let skippedEffective = false;

  return (content || []).filter((block) => {
    const text = String(block?.text || "").trim();

    if (
      (block?.type === "heading" || block?.type === "title") &&
      text === policy?.title &&
      !skippedTitle
    ) {
      skippedTitle = true;
      return false;
    }

    if (
      (block?.type === "text" || block?.type === "paragraph") &&
      text === policy?.subtitle &&
      !skippedSubtitle
    ) {
      skippedSubtitle = true;
      return false;
    }

    if (!skippedEffective && /^(effective\s*date|effective\s*from)\b/i.test(text)) {
      skippedEffective = true;
      return false;
    }

    return true;
  });
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function headingLevel(block) {
  const number = String(block?.number || "").trim();
  if (/^\d+\.\d+/.test(number)) return 3;
  const text = String(block?.text || "");
  if (/^\d+\.\d+/.test(text)) return 3;
  return 2;
}

function isSequentialList(items) {
  const markers = (items || [])
    .map((item) => String(item?.marker || "").trim())
    .filter(Boolean);
  if (markers.length !== (items || []).length || markers.length === 0) return false;
  const unique = new Set(markers);
  if (unique.size === 1) return false;
  return markers.every((marker) => /^\d+[\.)]$/.test(marker) || /^[a-z][\.)]$/i.test(marker));
}

function isShortInfoLine(block) {
  if (!block || (block.type !== "paragraph" && block.type !== "text")) return false;
  const text = String(block.text || "").trim();
  if (!text || text.length > 120) return false;
  return true;
}

function isContactish(text) {
  return /email\s*:|phone\s*:|@|private limited|floor|sector|gurugram|haryana|\+?\d[\d\s-]{8,}/i.test(
    String(text || ""),
  );
}

const linkClass =
  "font-medium text-[#0D614E] underline decoration-[#0D614E]/25 underline-offset-2 hover:decoration-[#0D614E]";

function LinkedText({ text }) {
  const nodes = useMemo(() => {
    const value = String(text || "");
    const pattern =
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(https?:\/\/[^\s]+)|(\+91[\s-]?[6-9]\d{9}|[6-9]\d{9})/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = pattern.exec(value)) !== null) {
      if (match.index > lastIndex) {
        parts.push(value.slice(lastIndex, match.index));
      }

      if (match[1]) {
        parts.push(
          <a key={`email-${key++}`} href={`mailto:${match[1]}`} className={linkClass}>
            {match[1]}
          </a>,
        );
      } else if (match[2]) {
        const href = match[2].replace(/[),.;]+$/, "");
        parts.push(
          <a
            key={`url-${key++}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            {href}
          </a>,
        );
      } else if (match[3]) {
        const digits = match[3].replace(/\s+/g, "");
        parts.push(
          <a key={`tel-${key++}`} href={`tel:${digits}`} className={linkClass}>
            {match[3]}
          </a>,
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < value.length) parts.push(value.slice(lastIndex));
    return parts.length ? parts : value;
  }, [text]);

  return <>{nodes}</>;
}

function RichText({ text }) {
  const value = String(text || "");
  const labeled = value.match(/^([^:]{2,48}):\s+(.+)$/);

  if (labeled && !/^https?:/i.test(labeled[1])) {
    return (
      <>
        <span className="font-semibold text-slate-800">{labeled[1]}:</span>{" "}
        <LinkedText text={labeled[2]} />
      </>
    );
  }

  return <LinkedText text={value} />;
}

function contactIcon(text) {
  const value = String(text || "").trim();
  if (/email\s*:|@/i.test(value)) return Mail;
  if (/phone\s*:/i.test(value) || /^[+\d][\d\s-]{8,}$/.test(value)) return Phone;
  if (/floor|sector|gurugram|haryana|,\s*\d{6}/i.test(value)) return MapPin;
  return null;
}

function ContactCard({ lines }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#cfe6dc] bg-[#f4faf7]">
      <div className="space-y-0 divide-y divide-[#d8eee6]">
        {lines.map(({ block, index }) => {
          const text = String(block?.text || "").trim();
          const Icon = contactIcon(text);

          return (
            <p key={`contact-${index}`} className="flex items-start gap-3 px-4 py-3 text-[15px] leading-6 text-slate-700">
              {Icon ? (
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0D614E]" />
              ) : (
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0D614E]" />
              )}
              <span>
                <RichText text={text} />
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

function PolicyBlock({ block, index }) {
  if (!block || typeof block !== "object") return null;

  if (block.type === "title") {
    return null;
  }

  if (block.type === "heading") {
    const id = slugify(block.text, index);
    const level = headingLevel(block);

    if (level === 3) {
      return (
        <h3
          id={id}
          className="scroll-mt-28 flex items-baseline gap-2.5 pt-2 font-display text-[1.05rem] font-semibold leading-snug tracking-tight text-[#0D614E] md:text-lg"
        >
          {block.number ? (
            <span className="shrink-0 font-sans text-[13px] font-semibold tabular-nums text-[#0D614E]/55">
              {block.number}
            </span>
          ) : null}
          <span>{block.text}</span>
        </h3>
      );
    }

    return (
      <h2
        id={id}
        className="scroll-mt-28 flex items-start gap-3 font-display text-xl font-semibold leading-snug tracking-tight text-[#0D614E] md:text-[1.4rem]"
      >
        {block.number ? (
          <span className="mt-0.5 inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-[#0D614E] px-2 text-sm font-semibold tabular-nums text-white">
            {block.number}
          </span>
        ) : null}
        <span className="pt-0.5">{block.text}</span>
      </h2>
    );
  }

  if (block.type === "list") {
    const items = Array.isArray(block.items) ? block.items : [];
    const ordered = isSequentialList(items);
    const ListTag = ordered ? "ol" : "ul";

    return (
      <ListTag className={`space-y-2.5 ${ordered ? "list-decimal pl-5" : "pl-0"}`}>
        {items.map((item, itemIndex) => (
          <li
            key={`${index}-${itemIndex}`}
            className={
              ordered
                ? "pl-1 leading-[1.75] text-slate-700"
                : "flex items-start gap-3 leading-[1.75] text-slate-700"
            }
          >
            {!ordered && (
              <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0D614E]" />
            )}
            <span>
              <RichText text={item?.text} />
            </span>
          </li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "text" || block.type === "paragraph" || block.text) {
    return (
      <p className="text-[15px] leading-[1.8] text-slate-700 md:text-base md:leading-[1.85]">
        <LinkedText text={block.text} />
      </p>
    );
  }

  return null;
}

function renderBlockSequence(items) {
  const nodes = [];
  let i = 0;

  while (i < items.length) {
    const current = items[i];
    const next = items[i + 1];
    const after = items[i + 2];
    const looksLikeCard =
      isShortInfoLine(current.block) &&
      next &&
      isShortInfoLine(next.block) &&
      (isContactish(current.block.text) ||
        isContactish(next.block.text) ||
        (after && isShortInfoLine(after.block)));

    if (looksLikeCard) {
      const group = [];
      while (i < items.length && isShortInfoLine(items[i].block)) {
        group.push(items[i]);
        i += 1;
      }
      nodes.push(<ContactCard key={`card-${current.index}`} lines={group} />);
      continue;
    }

    nodes.push(
      <PolicyBlock
        key={`${current.block?.type || "block"}-${current.index}`}
        block={current.block}
        index={current.index}
      />,
    );
    i += 1;
  }

  return nodes;
}

function groupSections(blocks) {
  const intro = [];
  const sections = [];
  let current = null;

  blocks.forEach((block, index) => {
    const isTopHeading = block?.type === "heading" && headingLevel(block) === 2;

    if (isTopHeading) {
      current = { heading: block, index, items: [] };
      sections.push(current);
      return;
    }

    const item = { block, index };
    if (current) current.items.push(item);
    else intro.push(item);
  });

  return { intro, sections };
}

function effectiveDateText(policy) {
  const block = (policy?.content || []).find((item) =>
    /^(effective\s*date|effective\s*from)\b/i.test(String(item?.text || "").trim()),
  );
  return block?.text?.trim() || formatDate(policy?.published_at || policy?.effective_from);
}

function PrivacySkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-8 rounded-3xl border border-[#d8eee6] bg-white px-6 py-10 md:px-12">
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-[#0D614E]/10" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-11/12 rounded bg-slate-100" />
        <div className="h-4 w-4/5 rounded bg-slate-100" />
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3 border-t border-slate-100 pt-6">
          <div className="h-6 w-56 rounded bg-[#0D614E]/10" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-10/12 rounded bg-slate-100" />
          <div className="h-4 w-8/12 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function TocNav({ headings, activeId, onNavigate }) {
  return (
    <nav className="space-y-0.5" aria-label="On this page">
      {headings.map((heading) => {
        const active = heading.id === activeId;
        return (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(heading.id);
            }}
            className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-[13px] leading-5 transition-colors ${
              active
                ? "bg-[#0D614E]/10 font-semibold text-[#0D614E]"
                : "text-slate-600 hover:bg-[#0D614E]/5 hover:text-[#0D614E]"
            }`}
          >
            {heading.number ? (
              <span className="mt-px w-5 shrink-0 tabular-nums text-[11px] font-semibold text-[#0D614E]/60">
                {heading.number}
              </span>
            ) : null}
            <span>{heading.text}</span>
          </a>
        );
      })}
    </nav>
  );
}

export default function PrivacyPolicyPage() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState("");
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const loadPolicy = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getLegalPolicy(POLICY_TYPE);
      setPolicy(data);
    } catch (err) {
      setPolicy(null);
      setError(err?.message || "Unable to load the Privacy Policy right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  useEffect(() => {
    const previousTitle = document.title;
    if (policy?.title) document.title = `${policy.title} | Ayurmuni`;
    return () => {
      document.title = previousTitle;
    };
  }, [policy]);

  const content = useMemo(() => visibleContent(policy?.content, policy), [policy]);
  const grouped = useMemo(() => groupSections(content), [content]);

  const headings = useMemo(
    () =>
      grouped.sections.map((section) => ({
        id: slugify(section.heading.text, section.index),
        text: section.heading.text,
        number: section.heading.number,
      })),
    [grouped.sections],
  );

  useEffect(() => {
    if (headings.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.2, 0.45] },
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const effectiveLabel = effectiveDateText(policy);

  const scrollToHeading = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  }, []);

  return (
    <>
      <section className="relative min-h-screen bg-[#f6faf8] pb-20">
        <motion.div
          style={{ scaleX: progress }}
          className="fixed left-0 top-0 z-[110] h-[3px] w-full origin-left bg-gradient-to-r from-[#0D614E] via-[#15725d] to-[#2aa37f]"
        />

        <header className="sticky top-0 z-40 border-b border-[#d8eee6] bg-[#f6faf8]/92 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-2.5 py-2.5 sm:px-6">
            <Link to="/login">
              <img
                src={logo}
                alt="Ayurmuni"
                className="h-10 w-auto object-contain sm:h-11"
              />
            </Link>
            <p className="truncate text-sm font-medium text-slate-500">
              {policy?.title || "Privacy Policy"}
            </p>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto mb-8 max-w-3xl text-center lg:mx-0 lg:max-w-none lg:text-left"
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0D614E]">
              Legal
            </p>
            <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-tight text-[#0D614E] sm:text-4xl md:text-[2.6rem]">
              {policy?.title || "Privacy Policy"}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-slate-600 lg:mx-0 md:text-base">
              {policy?.subtitle || "How we collect, use, and protect your information"}
            </p>
            {(effectiveLabel || policy?.version) && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {effectiveLabel && (
                  <span className="rounded-full border border-[#d8eee6] bg-white px-3 py-1 text-xs text-slate-600">
                    {effectiveLabel}
                  </span>
                )}
                {policy?.version ? (
                  <span className="rounded-full border border-[#d8eee6] bg-white px-3 py-1 text-xs text-slate-600">
                    Version {policy.version}
                  </span>
                ) : null}
              </div>
            )}
          </motion.header>

          {loading && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex items-center gap-2 text-sm text-[#0D614E]/80">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading privacy policy
              </div>
              <PrivacySkeleton />
            </div>
          )}

          {!loading && error && (
            <div className="mx-auto max-w-md rounded-3xl border border-red-100 bg-white px-6 py-10 text-center shadow-[0_10px_30px_rgba(13,97,78,0.05)]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-semibold text-slate-800">
                Could not load this policy
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
              <button
                type="button"
                onClick={loadPolicy}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0D614E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0a4f40]"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          )}

          {!loading && !error && policy && (
            <div className="space-y-6">
              {headings.length > 0 && (
                <details className="rounded-2xl border border-[#d8eee6] bg-white p-4 lg:hidden">
                  <summary className="cursor-pointer font-display text-sm font-semibold text-[#0D614E]">
                    Jump to a section
                  </summary>
                  <div className="mt-3 border-t border-[#e7f3ee] pt-3">
                    <TocNav headings={headings} activeId={activeId} onNavigate={scrollToHeading} />
                  </div>
                </details>
              )}

              <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
                <motion.article
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden rounded-3xl border border-[#d8eee6] bg-white shadow-[0_16px_40px_rgba(13,97,78,0.06)]"
                >
                  {grouped.intro.length > 0 && (
                    <div className="border-b border-[#e7f3ee] bg-[#f8fcfa] px-5 py-7 md:px-12 md:py-10">
                      <div className="max-w-3xl space-y-5 text-[15px] leading-[1.85] text-slate-700 md:text-base">
                        {renderBlockSequence(grouped.intro)}
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-[#eef4f1] px-5 md:px-12">
                    {grouped.sections.map((section) => (
                      <section
                        key={slugify(section.heading.text, section.index)}
                        className="space-y-4 py-8 md:space-y-5 md:py-10"
                      >
                        <PolicyBlock block={section.heading} index={section.index} />
                        <div className="max-w-3xl space-y-4 pl-0 md:pl-11">
                          {renderBlockSequence(section.items)}
                        </div>
                      </section>
                    ))}
                  </div>
                </motion.article>

                {headings.length > 0 && (
                  <aside className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto lg:block">
                    <div className="rounded-2xl border border-[#d8eee6] bg-white p-4">
                      <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0D614E]">
                        <Shield className="h-3.5 w-3.5" />
                        On this page
                      </p>
                      <TocNav headings={headings} activeId={activeId} onNavigate={scrollToHeading} />
                    </div>
                  </aside>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
