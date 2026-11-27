import React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  kind?: string
  rows?: { label: string; value: string }[]
}

const Email = ({ kind = 'Новая заявка', rows = [] }: Props) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>{kind} с сайта «Термин»</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>ТЕРМИН</Text>
        <Heading style={h1}>{kind}</Heading>
        <Hr style={hr} />
        <Section>
          {rows.map((r) => (
            <Text key={r.label} style={row}><strong>{r.label}:</strong> {r.value}</Text>
          ))}
        </Section>
        <Hr style={hr} />
        <Text style={muted}>Все заявки также доступны на странице администратора сайта.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `${d['kind'] ?? 'Новая заявка'} — ${d['name'] ?? 'сайт Термин'}`,
  displayName: 'Новая заявка (владельцу)',
  to: 'termin.info@yandex.ru',
  previewData: {
    kind: 'Запись на приёмку квартиры',
    name: 'Иван',
    rows: [
      { label: 'Дата', value: '28.11.2026, Утро (8:00–10:00)' },
      { label: 'Адрес', value: 'ул. Примерная, 1' },
      { label: 'Телефон', value: '+7 977 875 76 87' },
      { label: 'Имя', value: 'Иван' },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '28px 25px', maxWidth: '560px' }
const brand = { fontSize: '12px', letterSpacing: '3px', color: '#16a34a', fontWeight: 700, margin: 0 }
const h1 = { fontSize: '22px', color: '#111111', margin: '12px 0' }
const hr = { borderColor: '#e5e5e5', margin: '18px 0' }
const row = { fontSize: '14px', color: '#222222', margin: '6px 0', lineHeight: '20px' }
const muted = { fontSize: '12px', color: '#777777' }
