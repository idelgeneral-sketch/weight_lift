// מטמון פשוט בזיכרון (חי כל עוד הטאב פתוח). מטרתו: כשחוזרים למסך שכבר נטען פעם אחת
// באותה סשן, מציגים מיד את הנתונים הקודמים ומרעננים ברקע - במקום להראות "טוען..." שוב.

const store = new Map()

export function getCached(key) {
  return store.has(key) ? store.get(key) : null
}

export function setCached(key, value) {
  store.set(key, value)
}
