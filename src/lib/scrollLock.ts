/** Sheets can stack (a confirm over a form), so the body scroll lock is released only when the last one closes. */
let openSheets = 0

/** Locks page scrolling and returns the function that releases this lock. */
export const lockScroll = () => {
  openSheets += 1
  document.body.style.overflow = 'hidden'
  return () => {
    openSheets -= 1
    if (openSheets === 0) document.body.style.overflow = ''
  }
}
