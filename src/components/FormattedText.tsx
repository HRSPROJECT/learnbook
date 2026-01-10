'use client'

import React from 'react'

interface FormattedTextProps {
    text: string
    className?: string
}

/**
 * Processes text to render:
 * - **bold** as bold text
 * - *italic* as italic text
 * - Chemical formulas (H2O, CO2, etc.) with subscripts
 * - Math expressions with superscripts (x^2, e^x)
 * - Fractions like a/b
 */
export function FormattedText({ text, className = '' }: FormattedTextProps) {
    const processText = (input: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = []
        let remaining = input
        let key = 0

        while (remaining.length > 0) {
            // Check for bold **text**
            const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
            if (boldMatch) {
                parts.push(<strong key={key++}>{processText(boldMatch[1])}</strong>)
                remaining = remaining.slice(boldMatch[0].length)
                continue
            }

            // Check for italic *text*
            const italicMatch = remaining.match(/^\*([^*]+)\*/)
            if (italicMatch) {
                parts.push(<em key={key++}>{processText(italicMatch[1])}</em>)
                remaining = remaining.slice(italicMatch[0].length)
                continue
            }

            // Check for chemical formulas (e.g., H2O, CO2, NaCl, Ca(OH)2)
            const chemMatch = remaining.match(/^([A-Z][a-z]?)(\d+)?(\([A-Za-z]+\))?(\d+)?([A-Z][a-z]?)?(\d+)?/)
            if (chemMatch && (chemMatch[2] || chemMatch[4] || chemMatch[6])) {
                const formula = renderChemicalFormula(chemMatch[0])
                parts.push(<span key={key++} className="font-mono">{formula}</span>)
                remaining = remaining.slice(chemMatch[0].length)
                continue
            }

            // Check for superscript (x^2, e^n)
            const superMatch = remaining.match(/^(\w+)\^(\w+|\{[^}]+\})/)
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

            // Check for subscript (x_1, a_n)
            const subMatch = remaining.match(/^(\w+)_(\w+|\{[^}]+\})/)
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

            // No special formatting, add the character as-is
            parts.push(remaining[0])
            remaining = remaining.slice(1)
        }

        return parts
    }

    const renderChemicalFormula = (formula: string): React.ReactNode[] => {
        const result: React.ReactNode[] = []
        let i = 0
        let key = 0

        while (i < formula.length) {
            const char = formula[i]

            // Check for parentheses group like (OH)2
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

            // Check for element followed by number
            if (char.match(/[A-Z]/)) {
                let element = char
                // Check for lowercase second letter (like Na, Ca, Cl)
                if (i + 1 < formula.length && formula[i + 1].match(/[a-z]/)) {
                    element += formula[i + 1]
                    i++
                }
                result.push(<span key={key++}>{element}</span>)
                i++

                // Check for subscript number
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

    return <span className={className}>{processText(text)}</span>
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
