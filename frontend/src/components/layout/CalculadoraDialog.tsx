'use client';

import { useCallback, useState } from 'react';
import { Calculator, Delete, Divide, Equal, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Operador = '+' | '-' | '*' | '/';

const OPERADORES: { op: Operador; rotulo: string; icone: React.ReactNode }[] = [
  { op: '/', rotulo: 'Dividir', icone: <Divide className="h-4 w-4" /> },
  { op: '*', rotulo: 'Multiplicar', icone: <X className="h-4 w-4" /> },
  { op: '-', rotulo: 'Subtrair', icone: <Minus className="h-4 w-4" /> },
  { op: '+', rotulo: 'Somar', icone: <Plus className="h-4 w-4" /> },
];

interface Estado {
  /** Número em digitação (vírgula como separador decimal). */
  entrada: string;
  /** Operando à esquerda da operação pendente. */
  acumulado: number | null;
  operador: Operador | null;
  /** Próximo dígito recomeça o visor (após operador/resultado). */
  novaEntrada: boolean;
}

const ESTADO_INICIAL: Estado = { entrada: '0', acumulado: null, operador: null, novaEntrada: true };

/** Formata o resultado em pt-BR (vírgula decimal), limitando os decimais. */
function formatarResultado(valor: number): string {
  if (!Number.isFinite(valor)) return 'Erro';
  return String(Number(valor.toFixed(10))).replace('.', ',');
}

function paraNumero(entrada: string): number {
  return Number(entrada.replace(',', '.')) || 0;
}

function calcular(a: number, b: number, operador: Operador): number {
  switch (operador) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? NaN : a / b;
  }
}

/* Transições puras de estado: aplicadas via update funcional, cada tecla é
   atômica mesmo com eventos em rajada. */

function comDigito(s: Estado, d: string): Estado {
  let entrada: string;
  if (s.novaEntrada) entrada = d === ',' ? '0,' : d;
  else if (d === ',') entrada = s.entrada.includes(',') ? s.entrada : `${s.entrada},`;
  else entrada = s.entrada === '0' ? d : `${s.entrada}${d}`;
  return { ...s, entrada, novaEntrada: false };
}

function comOperador(s: Estado, op: Operador): Estado {
  const valor = paraNumero(s.entrada);
  if (s.acumulado !== null && s.operador !== null && !s.novaEntrada) {
    const resultado = calcular(s.acumulado, valor, s.operador);
    return {
      entrada: formatarResultado(resultado),
      acumulado: resultado,
      operador: op,
      novaEntrada: true,
    };
  }
  return { ...s, acumulado: valor, operador: op, novaEntrada: true };
}

function comIgual(s: Estado): Estado {
  if (s.acumulado === null || s.operador === null) return s;
  const resultado = calcular(s.acumulado, paraNumero(s.entrada), s.operador);
  return {
    entrada: formatarResultado(resultado),
    acumulado: null,
    operador: null,
    novaEntrada: true,
  };
}

function comApagar(s: Estado): Estado {
  if (s.novaEntrada) return s;
  return { ...s, entrada: s.entrada.length > 1 ? s.entrada.slice(0, -1) : '0' };
}

export function CalculadoraDialog() {
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const { entrada, acumulado, operador } = estado;

  const digito = useCallback((d: string) => setEstado((s) => comDigito(s, d)), []);
  const aplicarOperador = useCallback((op: Operador) => setEstado((s) => comOperador(s, op)), []);
  const igual = useCallback(() => setEstado(comIgual), []);
  const limpar = useCallback(() => setEstado(ESTADO_INICIAL), []);
  const apagar = useCallback(() => setEstado(comApagar), []);
  const percentual = useCallback(
    () =>
      setEstado((s) => ({
        ...s,
        entrada: formatarResultado(paraNumero(s.entrada) / 100),
        novaEntrada: true,
      })),
    [],
  );
  const inverterSinal = useCallback(
    () => setEstado((s) => ({ ...s, entrada: formatarResultado(-paraNumero(s.entrada)) })),
    [],
  );

  function aoTeclar(e: React.KeyboardEvent) {
    if (/^\d$/.test(e.key)) digito(e.key);
    else if (e.key === ',' || e.key === '.') digito(',');
    else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
      aplicarOperador(e.key);
    } else if (e.key === 'Enter' || e.key === '=') igual();
    else if (e.key === 'Backspace') apagar();
    else if (e.key === 'Delete' || e.key.toLowerCase() === 'c') limpar();
    else if (e.key === '%') percentual();
    else return;
    e.preventDefault();
  }

  const [teclaDividir, teclaMultiplicar, teclaSubtrair, teclaSomar] = OPERADORES.map(
    ({ op, rotulo, icone }) => (
      <TeclaOp
        key={op}
        ativa={operador === op}
        onClick={() => aplicarOperador(op)}
        aria-label={rotulo}
        title={rotulo}
      >
        {icone}
      </TeclaOp>
    ),
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Calculadora" title="Calculadora">
          <Calculator className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs" onKeyDown={aoTeclar}>
        <DialogHeader>
          <DialogTitle>Calculadora</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border bg-muted/40 px-4 py-3 text-right">
          <p className="h-4 text-xs text-muted-foreground tabular-nums">
            {acumulado !== null && operador !== null
              ? `${formatarResultado(acumulado)} ${operador.replace('*', '×').replace('/', '÷')}`
              : ' '}
          </p>
          <p className="truncate text-3xl font-semibold tabular-nums" aria-live="polite">
            {entrada}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <TeclaFn onClick={limpar}>C</TeclaFn>
          <TeclaFn onClick={inverterSinal} aria-label="Inverter sinal">
            +/−
          </TeclaFn>
          <TeclaFn onClick={percentual}>%</TeclaFn>
          {teclaDividir}

          {['7', '8', '9'].map((d) => (
            <Tecla key={d} onClick={() => digito(d)}>
              {d}
            </Tecla>
          ))}
          {teclaMultiplicar}

          {['4', '5', '6'].map((d) => (
            <Tecla key={d} onClick={() => digito(d)}>
              {d}
            </Tecla>
          ))}
          {teclaSubtrair}

          {['1', '2', '3'].map((d) => (
            <Tecla key={d} onClick={() => digito(d)}>
              {d}
            </Tecla>
          ))}
          {teclaSomar}

          <Tecla onClick={() => digito('0')}>0</Tecla>
          <Tecla onClick={() => digito(',')}>,</Tecla>
          <TeclaFn onClick={apagar} aria-label="Apagar" title="Apagar">
            <Delete className="h-4 w-4" />
          </TeclaFn>
          <Button className="h-12 text-base" onClick={igual} aria-label="Igual" title="Igual">
            <Equal className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type TeclaProps = React.ComponentProps<typeof Button>;

function Tecla({ className, ...props }: TeclaProps) {
  return <Button variant="secondary" className={cn('h-12 text-base', className)} {...props} />;
}

function TeclaFn({ className, ...props }: TeclaProps) {
  return <Button variant="outline" className={cn('h-12 text-base', className)} {...props} />;
}

function TeclaOp({ ativa, className, ...props }: TeclaProps & { ativa?: boolean }) {
  return (
    <Button
      variant={ativa ? 'default' : 'outline'}
      className={cn('h-12 text-base', className)}
      {...props}
    />
  );
}
