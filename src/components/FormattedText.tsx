'use client'

import React from 'react'

interface FormattedTextProps {
    text: string
    className?: string
}

/**
 * Enhanced markdown processor that handles:
 * - **bold** and *italic* text
 * - ***bold italic*** text
 * - `code` inline
 * - ```code blocks```
 * - # Headers
 * - - Lists
 * - | Tables |
 * - Chemical formulas (H2O, CO2)
 * - Math expressions (x^2, x_n)
 */
export function FormattedText({ text, className = '' }: FormattedTextProps) {
    if (!text) return null

    // Split by code blocks first to preserve them
    const processMarkdown = (input: string): React.ReactNode[] => {
        const result: React.ReactNode[] = []
        let key = 0

        // Split into lines for block-level processing
        const lines = input.split('\n')
        let i = 0

        while (i < lines.length) {
            const line = lines[i]

            // Code block with ```
            if (line.trim().startsWith('```')) {
                const codeLines: string[] = []
                const lang = line.trim().slice(3).trim()
                i++
                while (i < lines.length && !lines[i].trim().startsWith('```')) {
                    codeLines.push(lines[i])
                    i++
                }
                result.push(
                    <pre key={key++} className="bg-secondary/80 p-3 rounded-lg overflow-x-auto my-2 text-sm font-mono">
                        <code>{codeLines.join('\n')}</code>
                    </pre>
                )
                i++
                continue
            }

            // Table detection (lines starting with |)
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                const tableLines: string[] = [line]
                i++
                while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
                    tableLines.push(lines[i])
                    i++
                }
                result.push(renderTable(tableLines, key++))
                continue
            }

            // Headers
            if (line.startsWith('### ')) {
                result.push(<h4 key={key++} className="font-bold text-base mt-4 mb-2">{processInline(line.slice(4))}</h4>)
                i++
                continue
            }
            if (line.startsWith('## ')) {
                result.push(<h3 key={key++} className="font-bold text-lg mt-4 mb-2">{processInline(line.slice(3))}</h3>)
                i++
                continue
            }
            if (line.startsWith('# ')) {
                result.push(<h2 key={key++} className="font-bold text-xl mt-4 mb-2">{processInline(line.slice(2))}</h2>)
                i++
                continue
            }

            // Bullet lists
            if (line.match(/^[\s]*[-*•]\s/)) {
                const listItems: string[] = [line.replace(/^[\s]*[-*•]\s/, '')]
                i++
                while (i < lines.length && lines[i].match(/^[\s]*[-*•]\s/)) {
                    listItems.push(lines[i].replace(/^[\s]*[-*•]\s/, ''))
                    i++
                }
                result.push(
                    <ul key={key++} className="list-disc list-inside my-2 space-y-1">
                        {listItems.map((item, idx) => (
                            <li key={idx} className="text-foreground/80">{processInline(item)}</li>
                        ))}
                    </ul>
                )
                continue
            }

            // Numbered lists
            if (line.match(/^[\s]*\d+[.)]\s/)) {
                const listItems: string[] = [line.replace(/^[\s]*\d+[.)]\s/, '')]
                i++
                while (i < lines.length && lines[i].match(/^[\s]*\d+[.)]\s/)) {
                    listItems.push(lines[i].replace(/^[\s]*\d+[.)]\s/, ''))
                    i++
                }
                result.push(
                    <ol key={key++} className="list-decimal list-inside my-2 space-y-1">
                        {listItems.map((item, idx) => (
                            <li key={idx} className="text-foreground/80">{processInline(item)}</li>
                        ))}
                    </ol>
                )
                continue
            }

            // Empty line = paragraph break
            if (line.trim() === '') {
                result.push(<div key={key++} className="h-2" />)
                i++
                continue
            }

            // Regular paragraph
            result.push(<p key={key++} className="my-1">{processInline(line)}</p>)
            i++
        }

        return result
    }

    // Process inline formatting
    const processInline = (text: string): React.ReactNode => {
        if (!text) return null

        const parts: React.ReactNode[] = []
        let remaining = text
        let key = 0

        while (remaining.length > 0) {
            // Inline code `code`
            const codeMatch = remaining.match(/^`([^`]+)`/)
            if (codeMatch) {
                parts.push(
                    <code key={key++} className="bg-secondary/80 px-1.5 py-0.5 rounded text-sm font-mono">
                        {codeMatch[1]}
                    </code>
                )
                remaining = remaining.slice(codeMatch[0].length)
                continue
            }

            // Bold italic ***text***
            const boldItalicMatch = remaining.match(/^\*\*\*([^*]+)\*\*\*/)
            if (boldItalicMatch) {
                parts.push(<strong key={key++}><em>{processInline(boldItalicMatch[1])}</em></strong>)
                remaining = remaining.slice(boldItalicMatch[0].length)
                continue
            }

            // Bold **text**
            const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
            if (boldMatch) {
                parts.push(<strong key={key++}>{processInline(boldMatch[1])}</strong>)
                remaining = remaining.slice(boldMatch[0].length)
                continue
            }

            // Italic *text* (but not if preceded by word char)
            const italicMatch = remaining.match(/^\*([^*]+)\*/)
            if (italicMatch) {
                parts.push(<em key={key++}>{processInline(italicMatch[1])}</em>)
                remaining = remaining.slice(italicMatch[0].length)
                continue
            }

            // Underline __text__
            const underlineMatch = remaining.match(/^__([^_]+)__/)
            if (underlineMatch) {
                parts.push(<u key={key++}>{processInline(underlineMatch[1])}</u>)
                remaining = remaining.slice(underlineMatch[0].length)
                continue
            }

            // Strikethrough ~~text~~
            const strikeMatch = remaining.match(/^~~([^~]+)~~/)
            if (strikeMatch) {
                parts.push(<s key={key++}>{processInline(strikeMatch[1])}</s>)
                remaining = remaining.slice(strikeMatch[0].length)
                continue
            }

            // Links [text](url)
            const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
            if (linkMatch) {
                parts.push(
                    <a key={key++} href={linkMatch[2]} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">
                        {linkMatch[1]}
                    </a>
                )
                remaining = remaining.slice(linkMatch[0].length)
                continue
            }

            // Integral symbol ∫ with expression like ∫x^2 dx
            const integralMatch = remaining.match(/^∫([^∫]+?)\s*d([a-z])/)
            if (integralMatch) {
                parts.push(
                    <span key={key++} className="font-mono">
                        <span className="text-lg">∫</span>
                        {processInline(integralMatch[1].trim())}
                        <span className="ml-1">d{integralMatch[2]}</span>
                    </span>
                )
                remaining = remaining.slice(integralMatch[0].length)
                continue
            }

            // Just integral symbol
            if (remaining.startsWith('∫')) {
                parts.push(<span key={key++} className="font-mono text-lg">∫</span>)
                remaining = remaining.slice(1)
                continue
            }

            // Derivative notation f'(x) or f''(x)
            const derivativeMatch = remaining.match(/^([a-zA-Z])(''+)\(([^)]+)\)/)
            if (derivativeMatch) {
                const primeCount = derivativeMatch[2].length
                const primes = '′'.repeat(primeCount) // proper prime symbol
                parts.push(
                    <span key={key++} className="font-mono">
                        {derivativeMatch[1]}{primes}({processInline(derivativeMatch[3])})
                    </span>
                )
                remaining = remaining.slice(derivativeMatch[0].length)
                continue
            }

            // Fraction notation (a/b) or (1/3)x^3
            const fractionMatch = remaining.match(/^\((\d+)\/(\d+)\)/)
            if (fractionMatch) {
                parts.push(
                    <span key={key++} className="inline-flex flex-col items-center text-sm mx-0.5 align-middle">
                        <span className="border-b border-current px-0.5 leading-tight">{fractionMatch[1]}</span>
                        <span className="px-0.5 leading-tight">{fractionMatch[2]}</span>
                    </span>
                )
                remaining = remaining.slice(fractionMatch[0].length)
                continue
            }

            // Simple fraction a/b (without parentheses, for display in expressions)
            const simpleFracMatch = remaining.match(/^(\d+)\/(\d+)(?![^(]*\))/)
            if (simpleFracMatch && !remaining.match(/^\d+\/\d+\s*[a-zA-Z]/)) {
                // Only match if it's a standalone fraction, not part of expression
                parts.push(
                    <span key={key++} className="font-mono">{simpleFracMatch[1]}/{simpleFracMatch[2]}</span>
                )
                remaining = remaining.slice(simpleFracMatch[0].length)
                continue
            }

            // Function notation f(x), g(x), etc.
            const funcMatch = remaining.match(/^([fghFGH])\(([^)]+)\)\s*=/)
            if (funcMatch) {
                parts.push(
                    <span key={key++} className="font-mono">
                        {funcMatch[1]}({processInline(funcMatch[2])}) =
                    </span>
                )
                remaining = remaining.slice(funcMatch[0].length)
                continue
            }

            // Superscript x^2 or x^{abc} - now also handles expressions like x^3
            const superMatch = remaining.match(/^([a-zA-Z0-9\)]+)\^(\{[^}]+\}|-?\d+|[a-zA-Z])/)
            if (superMatch) {
                const base = superMatch[1]
                const exp = superMatch[2].replace(/^\{|\}$/g, '')
                parts.push(
                    <span key={key++} className="font-mono">
                        {base}<sup className="text-xs">{exp}</sup>
                    </span>
                )
                remaining = remaining.slice(superMatch[0].length)
                continue
            }

            // Subscript x_2 or x_{abc}
            const subMatch = remaining.match(/^(\w+)_(\{[^}]+\}|\w+)/)
            if (subMatch) {
                const base = subMatch[1]
                const sub = subMatch[2].replace(/^\{|\}$/g, '')
                parts.push(
                    <span key={key++} className="font-mono">
                        {base}<sub className="text-xs">{sub}</sub>
                    </span>
                )
                remaining = remaining.slice(subMatch[0].length)
                continue
            }

            // Special math symbols
            const mathSymbols: Record<string, string> = {
                '>=': '≥',
                '<=': '≤',
                '!=': '≠',
                '+-': '±',
                '->': '→',
                '<-': '←',
                '=>': '⇒',
                '<=>': '⇔',
                '...': '…',
                'infinity': '∞',
                'sqrt': '√',
                'pi': 'π',
                'theta': 'θ',
                'alpha': 'α',
                'beta': 'β',
                'gamma': 'γ',
                'delta': 'δ',
                'sigma': 'σ',
                'sum': '∑',
                'prod': '∏',
            }

            let foundSymbol = false
            for (const [text, symbol] of Object.entries(mathSymbols)) {
                if (remaining.toLowerCase().startsWith(text)) {
                    parts.push(<span key={key++}>{symbol}</span>)
                    remaining = remaining.slice(text.length)
                    foundSymbol = true
                    break
                }
            }
            if (foundSymbol) continue

            // Chemical formula detection (H2O, CO2, NaCl, etc.)
            const chemMatch = remaining.match(/^([A-Z][a-z]?)(\d+)?([A-Z][a-z]?)?(\d+)?([A-Z][a-z]?)?(\d+)?/)
            if (chemMatch && (chemMatch[2] || chemMatch[4] || chemMatch[6])) {
                // Only render as chemical if there are subscript numbers
                parts.push(<span key={key++} className="font-mono">{renderChemicalFormula(chemMatch[0])}</span>)
                remaining = remaining.slice(chemMatch[0].length)
                continue
            }

            // Regular character
            parts.push(remaining[0])
            remaining = remaining.slice(1)
        }

        return parts
    }

    // Render chemical formula with subscripts
    const renderChemicalFormula = (formula: string): React.ReactNode[] => {
        const result: React.ReactNode[] = []
        let i = 0
        let key = 0

        while (i < formula.length) {
            const char = formula[i]

            // Parentheses group like (OH)2
            if (char === '(') {
                const closeIdx = formula.indexOf(')', i)
                if (closeIdx > i) {
                    const group = formula.slice(i + 1, closeIdx)
                    const numMatch = formula.slice(closeIdx + 1).match(/^(\d+)/)
                    result.push(<span key={key++}>({group})</span>)
                    if (numMatch) {
                        result.push(<sub key={key++} className="text-xs">{numMatch[1]}</sub>)
                        i = closeIdx + 1 + numMatch[1].length
                    } else {
                        i = closeIdx + 1
                    }
                    continue
                }
            }

            // Element followed by number
            if (char.match(/[A-Z]/)) {
                let element = char
                if (i + 1 < formula.length && formula[i + 1].match(/[a-z]/)) {
                    element += formula[i + 1]
                    i++
                }
                result.push(<span key={key++}>{element}</span>)
                i++

                // Subscript number
                let num = ''
                while (i < formula.length && formula[i].match(/\d/)) {
                    num += formula[i]
                    i++
                }
                if (num) {
                    result.push(<sub key={key++} className="text-xs">{num}</sub>)
                }
                continue
            }

            result.push(formula[i])
            i++
        }

        return result
    }

    // Render table from markdown lines
    const renderTable = (lines: string[], key: number): React.ReactNode => {
        if (lines.length < 2) return null

        const parseRow = (line: string): string[] => {
            return line
                .split('|')
                .slice(1, -1)  // Remove first and last empty elements
                .map(cell => cell.trim())
        }

        const headerCells = parseRow(lines[0])
        const isHeader = lines[1]?.match(/^\|[\s-:|]+\|$/)
        const bodyRows = lines.slice(isHeader ? 2 : 1)

        return (
            <div key={key} className="overflow-x-auto my-3">
                <table className="min-w-full border border-card-border rounded-lg overflow-hidden">
                    <thead className="bg-secondary/50">
                        <tr>
                            {headerCells.map((cell, idx) => (
                                <th key={idx} className="px-4 py-2 text-left font-semibold border-b border-card-border">
                                    {processInline(cell)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {bodyRows.map((row, rowIdx) => (
                            <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-background' : 'bg-secondary/20'}>
                                {parseRow(row).map((cell, cellIdx) => (
                                    <td key={cellIdx} className="px-4 py-2 border-b border-card-border/50">
                                        {processInline(cell)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    return <div className={className}>{processMarkdown(text)}</div>
}

/**
 * Renders math formulas with proper formatting
 */
export function MathFormula({ formula, className = '' }: { formula: string; className?: string }) {
    const renderMath = (input: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = []
        let remaining = input
        let key = 0

        while (remaining.length > 0) {
            // Superscript: ^2, ^n, ^{2n}
            const superMatch = remaining.match(/^\^(\{[^}]+\}|\w+)/)
            if (superMatch) {
                const exp = superMatch[1].replace(/^\{|\}$/g, '')
                parts.push(<sup key={key++} className="text-xs">{renderMath(exp)}</sup>)
                remaining = remaining.slice(superMatch[0].length)
                continue
            }

            // Subscript: _2, _n, _{2n}
            const subMatch = remaining.match(/^_(\{[^}]+\}|\w+)/)
            if (subMatch) {
                const sub = subMatch[1].replace(/^\{|\}$/g, '')
                parts.push(<sub key={key++} className="text-xs">{renderMath(sub)}</sub>)
                remaining = remaining.slice(subMatch[0].length)
                continue
            }

            // Fraction: \frac{a}{b}
            const fracMatch = remaining.match(/^\\frac\{([^}]+)\}\{([^}]+)\}/)
            if (fracMatch) {
                parts.push(
                    <span key={key++} className="inline-flex flex-col items-center text-sm mx-1">
                        <span className="border-b border-current px-1">{renderMath(fracMatch[1])}</span>
                        <span className="px-1">{renderMath(fracMatch[2])}</span>
                    </span>
                )
                remaining = remaining.slice(fracMatch[0].length)
                continue
            }

            // Square root: \sqrt{x}
            const sqrtMatch = remaining.match(/^\\sqrt\{([^}]+)\}/)
            if (sqrtMatch) {
                parts.push(
                    <span key={key++} className="inline-flex items-center">
                        <span>√</span>
                        <span className="border-t border-current px-0.5">{renderMath(sqrtMatch[1])}</span>
                    </span>
                )
                remaining = remaining.slice(sqrtMatch[0].length)
                continue
            }

            // Greek letters
            const greekMap: Record<string, string> = {
                '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
                '\\epsilon': 'ε', '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ',
                '\\pi': 'π', '\\sigma': 'σ', '\\omega': 'ω', '\\phi': 'φ',
                '\\Delta': 'Δ', '\\Sigma': 'Σ', '\\Omega': 'Ω', '\\infty': '∞'
            }

            let foundGreek = false
            for (const [latex, symbol] of Object.entries(greekMap)) {
                if (remaining.startsWith(latex)) {
                    parts.push(<span key={key++}>{symbol}</span>)
                    remaining = remaining.slice(latex.length)
                    foundGreek = true
                    break
                }
            }
            if (foundGreek) continue

            // Math operators
            const opMap: Record<string, string> = {
                '\\times': '×', '\\div': '÷', '\\pm': '±', '\\leq': '≤',
                '\\geq': '≥', '\\neq': '≠', '\\approx': '≈', '\\rightarrow': '→'
            }

            let foundOp = false
            for (const [latex, symbol] of Object.entries(opMap)) {
                if (remaining.startsWith(latex)) {
                    parts.push(<span key={key++}> {symbol} </span>)
                    remaining = remaining.slice(latex.length)
                    foundOp = true
                    break
                }
            }
            if (foundOp) continue

            parts.push(remaining[0])
            remaining = remaining.slice(1)
        }

        return parts
    }

    return <span className={`font-mono ${className}`}>{renderMath(formula)}</span>
}

export default FormattedText
