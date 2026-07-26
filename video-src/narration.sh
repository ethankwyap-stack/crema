#!/bin/bash
declare -a LINES=(
"This is for the coffee shops where the recipes live in somebody's head."
"Real posts from real coffee people. Nine out of ten shops: no standards. No training guide. No recipe book. And the knowledge walks out the door with every resignation."
"Portafile starts with the thing your shop already trusts: the recipe card. Fifteen drinks, seeded and editable. Never a blank page."
"But these cards know something a laminated card never did: what every drink actually costs you. Watch. Milk gets more expensive... and every card re-prices itself. That latte keeps three dollars and seventy eight cents. Green coffee has doubled. Guessing is over."
"The morning question — what's the grind today? — answered before anyone has to ask. Logged per bean, in seconds, with history. Your shop finally has a memory."
"New hire starts Monday? Order the training path. Track sign-offs by name."
"Then print the whole pack: cover, checklist, cards, today's dial-ins. Paper survives the rush. The app keeps the paper honest."
"Portafile. Free to open today. No account. No server. No catch. Your whole shop — dialed in."
)
for i in "${!LINES[@]}"; do
  n=$((i+1))
  say -v Samantha -r 172 -o "vo$n.aiff" "${LINES[$i]}"
  d=$(afinfo "vo$n.aiff" | awk '/estimated duration/ {print $3}')
  echo "vo$n: ${d}s"
done
