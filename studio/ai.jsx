// Ajudas automáticas do painel: tradução para o inglês e descrição das imagens.
// O trabalho pesado roda no Worker do site (worker/index.js), com o Workers AI gratuito da Cloudflare.
import { useState } from 'react'
import { Button, Flex, Stack, Text } from '@sanity/ui'
import { set, useDocumentOperation, useFormValue } from 'sanity'

export const API = 'https://marinawoisky-site.penasci-design.workers.dev/api'
const PROJECT = 'wqz875em'
const DATASET = 'production'

async function post(path, body) {
  const r = await fetch(`${API}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await r.json().catch(() => ({}))
  if (!r.ok || data.error) throw new Error(data.error || `Erro ${r.status}`)
  return data
}

// image-<id>-<w>x<h>-<ext>  →  https://cdn.sanity.io/images/<proj>/<ds>/<id>-<w>x<h>.<ext>
export const assetUrl = (ref) => {
  const m = /^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/.exec(ref || '')
  return m ? `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${m[1]}-${m[2]}.${m[3]}` : null
}
export const describeImage = async (ref) => (await post('describe', { url: assetUrl(ref) })).alt

const isEmpty = (v) => v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0)
const seg = (arr, i) => (arr[i] && arr[i]._key ? `[_key=="${arr[i]._key}"]` : `[${i}]`)

// Percorre o documento e acha: campos bilíngues com inglês vazio, e imagens sem descrição
function scan(node, path, found) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => scan(item, path + seg(node, i), found))
    return
  }
  if (!node || typeof node !== 'object') return
  if ('pt' in node && !isEmpty(node.pt) && isEmpty(node.en)) {
    found.locale.push({ path: `${path}.en`, pt: node.pt })
    return
  }
  if (node.asset?._ref?.startsWith('image-') && isEmpty(node.alt)) found.images.push({ path: `${path}.alt`, ref: node.asset._ref })
  for (const [k, v] of Object.entries(node)) if (!k.startsWith('_') && k !== 'asset') scan(v, path ? `${path}.${k}` : k, found)
}

// Botão "Preencher automático" no documento (ao lado de Publish)
export function AutoFillAction(props) {
  const { id, type, draft, published, onComplete } = props
  const { patch } = useDocumentOperation(id, type)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const doc = draft || published

  const run = async () => {
    setBusy(true)
    try {
      const found = { locale: [], images: [] }
      scan(doc, '', found)
      if (!found.locale.length && !found.images.length) {
        setMsg('Nada a preencher: o inglês e as descrições das fotos já estão completos.')
        return
      }
      const sets = {}
      // Tradução: junta todos os trechos num pedido só
      const strings = []
      for (const f of found.locale) {
        if (typeof f.pt === 'string') strings.push(f.pt)
        else for (const b of f.pt) for (const c of b.children || []) strings.push(c.text || '')
      }
      const tr = strings.length ? (await post('translate', { texts: strings })).texts : []
      let k = 0
      for (const f of found.locale) {
        if (typeof f.pt === 'string') sets[f.path] = tr[k++]
        else sets[f.path] = f.pt.map((b) => ({ ...b, children: (b.children || []).map((c) => ({ ...c, text: tr[k++] })) }))
      }
      for (const f of found.images) sets[f.path] = await describeImage(f.ref)
      patch.execute([{ set: sets }])
      setMsg(`Pronto: ${found.locale.length} campo(s) traduzido(s) e ${found.images.length} foto(s) descrita(s). Confira e clique em Publish.`)
    } catch (e) {
      setMsg(`Não deu certo: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  return {
    label: busy ? 'Preenchendo…' : 'Preencher inglês e descrições',
    title: 'Traduz para o inglês os campos com inglês vazio e descreve as fotos sem descrição',
    disabled: busy || !doc,
    onHandle: run,
    dialog: msg && { type: 'dialog', header: 'Preenchimento automático', onClose: () => { setMsg(null); onComplete() }, content: <Text>{msg}</Text> },
  }
}

// Campo "Descrição da imagem" com botão "Gerar descrição"
export function AltInput(props) {
  const image = useFormValue(props.path.slice(0, -1))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const ref = image?.asset?._ref
  const gen = async () => {
    setBusy(true); setErr(null)
    try { props.onChange(set(await describeImage(ref))) } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <Flex gap={2} align="center">
        <Button mode="ghost" fontSize={1} padding={2} text={busy ? 'Gerando…' : 'Gerar descrição'} disabled={!ref || busy} onClick={gen} />
        {err && <Text size={1} muted>{err}</Text>}
      </Flex>
    </Stack>
  )
}

// Botão "Traduzir" em cada campo bilíngue (preenche o inglês a partir do português)
export function LocaleInput(props) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const pt = props.value?.pt
  const tr = async () => {
    setBusy(true); setErr(null)
    try {
      let en
      if (typeof pt === 'string') en = (await post('translate', { texts: [pt] })).texts[0]
      else {
        const strings = pt.flatMap((b) => (b.children || []).map((c) => c.text || ''))
        const out = (await post('translate', { texts: strings })).texts
        let k = 0
        en = pt.map((b) => ({ ...b, children: (b.children || []).map((c) => ({ ...c, text: out[k++] })) }))
      }
      props.onChange(set(en, ['en']))
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <Flex gap={2} align="center">
        <Button mode="ghost" fontSize={1} padding={2} text={busy ? 'Traduzindo…' : 'Traduzir para o inglês'} disabled={isEmpty(pt) || busy} onClick={tr} />
        {err && <Text size={1} muted>{err}</Text>}
      </Flex>
    </Stack>
  )
}
