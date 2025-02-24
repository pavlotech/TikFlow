import fs from 'fs'
import path from 'path'
import util from 'util'
import process from 'process'
import {
    LoggerOptions,
    CachedTimestamp,
    Level,
    Color,
    LogExtra
} from './logger.types'

export default class Logger {
    private currentLogFileName = ''
    private nextSaveTime = 0
    private cachedTimestamp: CachedTimestamp = { timeString: '', expires: 0 }
    private counters = new Map<string, number>()
    private timers = new Map<string, number>()
    private inlineActive = false

    /**
     * В этом свойстве мы храним «промежуточные» опции, заданные через .options().
     * После любого вызова логирующего метода мы их сбрасываем.
     */
    private pendingOptions: LogExtra | null = null

    constructor(private options: LoggerOptions) {
        this.options.logDirectory = path.resolve(options.logDirectory)
        fs.mkdirSync(this.options.logDirectory, { recursive: true })
        this.calcNextTime()
    }

    /**
     * Метод, позволяющий задать опции (color, noDate и т. д.)
     * цепочкой. Возвращает this, чтобы потом вызвать log() / debug() / ...
     */
    public opt(opts: LogExtra): this {
        this.pendingOptions = opts
        return this
    }

    /**
     * Базовый log. Если есть pendingOptions, то применяем их.
     */
    public log(...data: any[]) {
        this.finishInlineIfNeeded()
        const opts = this.pendingOptions
        this.pendingOptions = null
        if (!opts) {
            // Если нет опций, просто логируем по-старому
            this.logBase(data)
            return
        }
        // Иначе логируем с учётом опций
        this.logWithOptions(opts, data)
    }

    /**
     * «Сырые» методы (debug, info, warn, error, и т.д.)
     * — тоже используют pendingOptions, если есть.
     */
    public debug(...data: any[]) {
        this.finishInlineIfNeeded()
        const opts = this.pendingOptions
        this.pendingOptions = null
        if (!opts) this.output(Level.DEBUG, Color.GREEN, data)
        else this.outputWithOpts(Level.DEBUG, data, opts, Color.GREEN)
    }
    public info(...data: any[]) {
        this.finishInlineIfNeeded()
        const opts = this.pendingOptions
        this.pendingOptions = null
        if (!opts) this.output(Level.INFO, Color.GREEN, data)
        else this.outputWithOpts(Level.INFO, data, opts, Color.GREEN)
    }
    public warn(...data: any[]) {
        this.finishInlineIfNeeded()
        const opts = this.pendingOptions
        this.pendingOptions = null
        if (!opts) this.output(Level.WARN, Color.YELLOW, data)
        else this.outputWithOpts(Level.WARN, data, opts, Color.YELLOW)
    }
    public error(...data: any[]) {
        this.finishInlineIfNeeded()
        const opts = this.pendingOptions
        this.pendingOptions = null
        if (!opts) this.output(Level.ERROR, Color.RED, data)
        else this.outputWithOpts(Level.ERROR, data, opts, Color.RED)
    }

    /**
     * Остальные методы (assert, clear, count, group, table, ...) тоже
     * сбрасывают pendingOptions, если вдруг были.
     */
    public assert(condition: any, ...data: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        if (!condition) {
            const msg = data.length ? data.join(' ') : 'Assertion failed'
            this.output(Level.ASSERT, Color.RED, ['Assertion failed:', msg])
        }
    }
    public clear() {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        console.clear()
        this.output(Level.CLEAR, Color.GRAY, ['----- CONSOLE CLEARED -----'])
    }
    public count(label = 'default') {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        const val = (this.counters.get(label) || 0) + 1
        this.counters.set(label, val)
        this.output(Level.COUNT, Color.CYAN, [`${label}: ${val}`])
    }
    public countReset(label = 'default') {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        this.counters.set(label, 0)
        this.output(Level.COUNT, Color.CYAN, [`${label}: 0 (reset)`])
    }
    public dir(item: any, options?: util.InspectOptions) {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        const str = util.inspect(item, { depth: null, colors: this.options.colorizeObjects, ...options })
        this.output(Level.DIR, Color.WHITE, [str])
    }
    public dirxml(...data: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        this.output(Level.DIRXML, Color.WHITE, data)
    }
    public group(...data: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        this.output(Level.GROUP, Color.CYAN, data)
        console.group(...data)
    }
    public groupCollapsed(...data: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        this.output(Level.GROUPCOLLAPSED, Color.CYAN, data)
        console.groupCollapsed(...data)
    }
    public groupEnd() {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        this.output(Level.GROUPEND, Color.CYAN, ['(group end)'])
        console.groupEnd()
    }
    public table(rows: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        if (!Array.isArray(rows) || rows.length < 1) {
            this.output(Level.TABLE, Color.WHITE, ['(empty table)'])
            return
        }
        const tableString = this.makeAsciiTable(rows)
        console.log(this.timeString().replace(/\x1b\[[0-9;]*m/g, ''))
        console.log(tableString)
        this.writeFile(Level.TABLE, 'Custom table used')
    }
    public time(label = 'default') {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        this.timers.set(label, Date.now())
        this.output(Level.TIME, Color.MAGENTA, [`Timer "${label}" started`])
    }
    public timeLog(label = 'default', ...data: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        const start = this.timers.get(label)
        if (!start) {
            this.output(Level.TIMELOG, Color.RED, [`No such label "${label}"`])
            return
        }
        const duration = Date.now() - start
        this.output(Level.TIMELOG, Color.MAGENTA, [`Timer "${label}": ${duration}ms`, ...data])
    }
    public timeEnd(label = 'default') {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        const start = this.timers.get(label)
        if (!start) {
            this.output(Level.TIMEEND, Color.RED, [`No such label "${label}"`])
            return
        }
        const duration = Date.now() - start
        this.output(Level.TIMEEND, Color.MAGENTA, [`Timer "${label}" ended: ${duration}ms`])
        this.timers.delete(label)
    }
    public timeStamp(label?: string) {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        const txt = label ? `Timestamp [${label}]` : 'Timestamp'
        this.output(Level.TIMESTAMP, Color.GREEN, [txt])
    }
    public trace(...data: any[]) {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        const stack = new Error().stack || ''
        this.output(Level.TRACE, Color.MAGENTA, [...data, '\nStack Trace:', stack])
    }
    public profile(label = 'default') {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        this.output(Level.PROFILE, Color.GREEN, [`Profile "${label}" started`])
    }
    public profileEnd(label = 'default') {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        this.output(Level.PROFILEEND, Color.GREEN, [`Profile "${label}" ended`])
    }
    public progress(label: string, current: number, total: number, barLength = 20) {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        const ratio = total === 0 ? 0 : current / total
        const fillCount = Math.floor(ratio * barLength)
        const emptyCount = barLength - fillCount
        const bar = Color.GREEN + '█'.repeat(fillCount) + Color.GRAY + '─'.repeat(emptyCount) + Color.RESET
        const perc = (ratio * 100).toFixed(1) + '%'
        this.output(Level.PROGRESS, Color.CYAN, [`${label} ${bar} ${perc} (${current}/${total})`])
    }
    public progressInline(label: string, current: number, total: number, barLength = 20) {
        this.inlineActive = true
        this.pendingOptions = null
        const ratio = total === 0 ? 0 : current / total
        const fillCount = Math.floor(ratio * barLength)
        const emptyCount = barLength - fillCount
        const bar = Color.GREEN + '█'.repeat(fillCount) + Color.GRAY + '─'.repeat(emptyCount) + Color.RESET
        const perc = (ratio * 100).toFixed(1) + '%'
        const text = `[PROGRESS] ${label} ${bar} ${perc} (${current}/${total})`

        process.stdout.write('\r' + Color.CYAN + text + Color.RESET)
        if (current >= total) {
            console.log()
            this.inlineActive = false
        }
    }
    public lineChart(values: number[], colorHexOrAnsi?: string) {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        if (!Array.isArray(values) || values.length === 0) {
            this.output(Level.LOG, Color.WHITE, ['(empty chart)'])
            return
        }
        const colorSeq = colorHexOrAnsi ? this.generateColorSeq(colorHexOrAnsi) : Color.GREEN
        const maxVal = Math.max(...values)
        const lines = values.map((val, idx) => {
            const bar = '█'.repeat(val)
            return `${idx}: ${colorSeq}${bar}${Color.RESET} (${val})`
        }).join('\n')

        console.log(this.timeString().replace(/\x1b\[[0-9;]*m/g, ''))
        console.log(lines)
        this.writeFile(Level.LOG, `lineChart with ${values.length} bars (max=${maxVal})`)
    }
    public verticalChart(values: number[], options?: {
        labels?: string[]
        colors?: string[]
        height?: number
        yTicks?: number
    }) {
        this.finishInlineIfNeeded()
        this.pendingOptions = null
        if (!Array.isArray(values) || values.length === 0) {
            this.output(Level.LOG, Color.WHITE, ['(no data for verticalChart)'])
            return
        }
        const labels = options?.labels ?? []
        const colors = options?.colors ?? []
        const maxVal = Math.max(...values)
        const height = options?.height && options.height > 0 ? options.height : 10
        const yTicks = options?.yTicks && options.yTicks > 0 ? options.yTicks : 5

        const effectiveMax = maxVal === 0 ? 1 : maxVal
        const lines: string[] = []
        const step = height / yTicks

        for (let level = height; level >= 1; level--) {
            let row = ''
            let drawLine = false
            const gridYs: number[] = []
            for (let g = 1; g <= yTicks; g++) {
                gridYs.push(g * step)
            }
            for (const gy of gridYs) {
                if (Math.abs(gy - level) < 0.5) {
                    drawLine = true
                    break
                }
            }

            for (let b = 0; b < values.length; b++) {
                const val = values[b]
                const barHeight = Math.round((val * height) / effectiveMax)
                let colorSeq = Color.YELLOW
                if (colors[b]) colorSeq = this.generateColorSeq(colors[b])

                if (level <= barHeight && val > 0) {
                    row += colorSeq + '█' + Color.RESET + ' '
                } else {
                    if (drawLine) row += Color.GRAY + '·' + Color.RESET + ' '
                    else row += '  '
                }
            }
            lines.push(row)
        }

        let xAxis = ''
        for (let b = 0; b < values.length; b++) {
            xAxis += '┬ '
        }
        xAxis = '└' + xAxis.slice(1)

        let labelLine = ''
        if (labels.length > 0) {
            for (let i = 0; i < values.length; i++) {
                const lbl = labels[i] ?? ''
                labelLine += lbl.padEnd(2, ' ') + ' '
            }
        }

        console.log(this.timeString().replace(/\x1b\[[0-9;]*m/g, ''))
        for (const ln of lines) console.log(ln)
        console.log(xAxis)
        if (labelLine) console.log(labelLine)

        this.writeFile(Level.LOG, `verticalChart bars=${values.length}, max=${maxVal}`)
    }

    /**
     * =================== Вспомогательные методы =====================
     */

    /**
     * Базовый лог без опций (прежний вариант).
     */
    private logBase(data: any[]) {
        const msg = data.map(x =>
            typeof x === 'object'
                ? util.inspect(x, { depth: null, colors: this.options.colorizeObjects })
                : String(x)
        ).join(' ')

        this.writeFile(Level.LOG, msg)
        console.log(this.timeString() + Color.WHITE + `[LOG] ${msg}`, Color.RESET)
    }

    /**
     * Логирование с учётом опций, аналогично старому logEx.
     */
    private logWithOptions(opts: LogExtra, data: any[]) {
        const noDate = !!opts.noDate
        const colorSeq = opts.color ? this.generateColorSeq(opts.color) : Color.WHITE
        const rainbow = !!opts.rainbow
        const map = opts.colorMap

        const msg = data.map(x =>
            typeof x === 'object'
                ? util.inspect(x, { depth: null, colors: this.options.colorizeObjects })
                : String(x)
        ).join(' ')

        let final = msg
        if (map && map.length > 0) {
            final = this.colorMapify(msg, map)
        } else if (rainbow) {
            final = this.rainbowify(msg)
        }

        if (!noDate) {
            this.writeFile(Level.LOG, final)
        }

        const prefix = noDate ? '' : this.timeString() + colorSeq + `[LOG] `
        console.log(prefix + (map ? final : final + Color.RESET))
    }

    /**
     * То же самое для остальных (debug/info/etc.) если у нас есть pendingOptions.
     */
    private outputWithOpts(level: Level, data: any[], opts: LogExtra, defaultColor: Color) {
        const noDate = !!opts.noDate
        const colorSeq = opts.color ? this.generateColorSeq(opts.color) : defaultColor
        const rainbow = !!opts.rainbow
        const map = opts.colorMap

        const msg = data.map(x =>
            typeof x === 'object'
                ? util.inspect(x, { depth: null, colors: this.options.colorizeObjects })
                : String(x)
        ).join(' ')

        let final = msg
        if (map && map.length > 0) {
            final = this.colorMapify(msg, map)
        } else if (rainbow) {
            final = this.rainbowify(msg)
        }

        if (!noDate) {
            this.writeFile(level, final)
        }

        const prefix = noDate ? '' : this.timeString() + colorSeq + `[${level}] `
        console.log(prefix + (map ? final : final + Color.RESET))
    }

    private output(level: Level, color: string, data: any[]) {
        const msg = data.map(x =>
            typeof x === 'object'
                ? util.inspect(x, { depth: null, colors: this.options.colorizeObjects })
                : String(x)
        ).join(' ')
        this.writeFile(level, msg)
        console.log(this.timeString() + color + `[${level}] ${msg}`, Color.RESET)
    }

    private makeAsciiTable(rows: any[]): string {
        if (!rows.length) return '(empty)'
        const first = rows[0]
        if (typeof first !== 'object' || Array.isArray(first) || !first) {
            return rows.map((x, i) => `${i}: ${String(x)}`).join('\n')
        }
        const keys = Object.keys(first)
        const widths = keys.map(k =>
            Math.max(k.length, ...rows.map(r => String(r[k]).length))
        )
        const top = '┌' + widths.map(w => '─'.repeat(w + 2)).join('┬') + '┐'
        const middle = '├' + widths.map(w => '─'.repeat(w + 2)).join('┼') + '┤'
        const bottom = '└' + widths.map(w => '─'.repeat(w + 2)).join('┴') + '┘'
        const head = '│' + keys.map((k, i) => ' ' + k.padEnd(widths[i]) + ' ').join('│') + '│'
        const body = rows.map(r => {
            return '│' + keys.map((k, i) => {
                const val = r[k] == null ? '' : String(r[k])
                return ' ' + val.padEnd(widths[i]) + ' '
            }).join('│') + '│'
        })
        return [top, head, middle, ...body, bottom].join('\n')
    }

    private timeString() {
        const now = Date.now()
        if (now > this.cachedTimestamp.expires) {
            const d = new Date()
            const off = d.getTimezoneOffset()
            const sign = off < 0 ? '+' : '-'
            const hh = String(Math.abs(Math.floor(off / 60))).padStart(2, '0')
            const mm = String(Math.abs(off % 60)).padStart(2, '0')
            const ds = d.toISOString().slice(0, 10)
            const ts = d.toLocaleTimeString()
            this.cachedTimestamp.timeString = `${Color.GRAY}[${sign}${hh}:${mm} ${ds} ${ts}]${Color.RESET} `
            this.cachedTimestamp.expires = now + 1000
        }
        return this.cachedTimestamp.timeString
    }

    private calcNextTime() {
        const now = Date.now()
        const interval = this.options.saveIntervalHours
            ? this.options.saveIntervalHours * 3600000
            : 86400000
        this.nextSaveTime = now + interval
    }

    private writeFile(level: Level, msg: string) {
        const now = Date.now()
        if (now >= this.nextSaveTime || !this.currentLogFileName) {
            this.calcNextTime()
            this.currentLogFileName = path.join(this.options.logDirectory, this.makeFileName())
        }
        const t = this.timeString().replace(/\x1b\[[0-9;]*m/g, '')
        fs.appendFileSync(this.currentLogFileName, `${t}[${level}] ${msg}\n`)
    }

    private makeFileName() {
        const iso = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16)
        return `${iso}.log`
    }

    private colorMapify(text: string, map: string[]): string {
        return text
            .split('')
            .map((ch, i) => this.generateColorSeq(map[i % map.length]) + ch)
            .join('') + Color.RESET
    }

    private rainbowify(str: string): string {
        const palette = [Color.RED, Color.GREEN, Color.YELLOW, Color.BLUE, Color.MAGENTA, Color.CYAN]
        return str.split('').map((ch, i) => palette[i % palette.length] + ch).join('') + Color.RESET
    }

    private generateColorSeq(input: string) {
        if (Object.values(Color).includes(input as Color)) {
            return input
        }
        if (input.startsWith('#') && (input.length === 7 || input.length === 4)) {
            const { r, g, b } = this.hexToRgb(input)
            return `\x1b[38;2;${r};${g};${b}m`
        }
        return Color.WHITE
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        let clean = hex.replace('#', '')
        if (clean.length === 3) {
            clean = clean.split('').map(c => c + c).join('')
        }
        const bigint = parseInt(clean, 16)
        const r = (bigint >> 16) & 255
        const g = (bigint >> 8) & 255
        const b = bigint & 255
        return { r, g, b }
    }

    private finishInlineIfNeeded() {
        if (this.inlineActive) {
            console.log()
            this.inlineActive = false
        }
    }
}