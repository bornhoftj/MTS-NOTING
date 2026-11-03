import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const FUN_FACTS = [
  "Did you know? Moving day in Quebec is traditionally July 1st. It's a massive logistical event across the province where hundreds of thousands of people change residences on the exact same day, requiring months of advance booking for movers.",
  "Fun Fact: The Trans-Canada Highway is one of the longest national highways in the world, stretching over 7,821 kilometers. A cross-country move from Victoria, BC to St. John's, NL can take a moving truck over a week of continuous driving!",
  "Did you know? Summer is the absolute peak season for the Canadian moving industry. Over 60% of all residential moves in Canada take place between the months of June and September, largely driven by the school calendar and favorable weather.",
  "Fun Fact: Bubble wrap was originally invented in 1957 by two engineers who were trying to create a textured, 3D plastic wallpaper. When that failed, they marketed it as greenhouse insulation before finally realizing its true potential as a revolutionary packing material.",
  "Did you know? The average Canadian will move approximately 5 to 6 times during their lifetime. This is slightly lower than the American average, but still represents a significant amount of packing, lifting, and address changing over the decades.",
  "Fun Fact: Moving a grand piano isn't just about heavy lifting; it requires specialized knowledge of the instrument's center of gravity. Movers must carefully remove the legs and strap the piano to a specialized 'piano board' to prevent warping the soundboard.",
  "Did you know? Transport Canada has strict regulations regarding the transportation of hazardous materials. Everyday household items like aerosol cans, paint thinner, propane tanks, and even some cleaning supplies cannot legally be loaded onto a standard moving truck.",
  "Fun Fact: Cardboard boxes, the staple of any move, were invented in China in the 15th century, but the corrugated cardboard box we use today was patented in 1856 in England—originally used as a liner for tall hats to keep their shape!",
  "Did you know? When moving across Canada, your belongings might cross up to six different time zones. A truck leaving Halifax, Nova Scotia, will have to adjust its clocks multiple times before arriving in Vancouver, British Columbia.",
  "Fun Fact: Moving to or from Vancouver Island or Newfoundland requires coordinating with massive commercial ferry systems. Moving trucks must be precisely weighed and measured to book commercial deck space, and rough seas can sometimes delay a move by days.",
  "Did you know? The busiest day of the week to move is Friday. Most people prefer to take one day off work and use the weekend to unpack and settle into their new home, making Friday bookings the hardest to secure with moving companies.",
  "Fun Fact: In the Canadian territories (Yukon, Northwest Territories, and Nunavut), some remote communities can only be accessed by moving trucks during the winter months when temporary 'ice roads' are frozen solid enough to support heavy freight.",
  "Did you know? If you are moving firewood across provincial borders in Canada, you might be breaking the law. The Canadian Food Inspection Agency restricts the movement of firewood to prevent the spread of invasive insects like the Emerald Ash Borer.",
  "Fun Fact: The heaviest residential item commonly moved is a large gun safe, which can weigh upwards of 1,000 to 1,500 pounds empty. Moving these requires specialized heavy-duty dollies, steel ramps, and sometimes even structural reinforcement of stairs.",
  "Did you know? Packing tape is specifically designed to adhere to the porous surface of cardboard. Using duct tape or masking tape on moving boxes is a common mistake, as they often peel off during transit when exposed to temperature changes in the truck.",
  "Fun Fact: The concept of a 'moving company' dates back to the mid-1800s when covered wagons were used to transport goods westward. Today, modern air-ride suspension trucks ensure that fragile items experience minimal vibration during long-haul transport.",
  "Did you know? When packing a moving box, the golden rule is to keep the weight under 50 pounds. Overpacking a box not only makes it dangerous for the movers to lift, but it also compromises the structural integrity of the cardboard, risking a blowout.",
  "Fun Fact: Moving house is consistently ranked as one of the top three most stressful life events, right alongside divorce and the death of a loved one. Hiring professional movers is statistically proven to significantly reduce the psychological toll of relocating.",
  "Did you know? If you're moving houseplants across Canada, the shock of temperature changes inside a dark moving truck can be fatal to them. Most professional moving companies actually prohibit live plants in long-distance loads for this exact reason.",
  "Fun Fact: The term 'bill of lading' used in moving contracts originates from maritime law. It literally means a 'bill of loading' and serves as a legal receipt of freight services, a contract between the carrier and shipper, and a document of title.",
  "Did you know? A fully loaded 53-foot moving trailer can hold the contents of approximately three to four average-sized Canadian homes. The driver must strategically load the truck to balance the weight over the axles to comply with highway weigh station regulations.",
  "Fun Fact: Wardrobe boxes were invented to save time and preserve clothing. Instead of folding everything, you can transfer clothes directly from your closet rod to the metal bar inside the box, keeping your garments wrinkle-free during the entire move.",
  "Did you know? In Canada, moving expenses can sometimes be tax-deductible. If you relocate at least 40 kilometers closer to a new place of work or full-time post-secondary education, you might be able to claim your moving costs on your CRA tax return.",
  "Fun Fact: The invention of the hand truck (or dolly) revolutionized the moving industry. Originally designed in the 18th century for moving heavy sacks of grain and barrels on docks, it is now the most essential tool in any professional mover's arsenal.",
  "Did you know? Books are deceivingly heavy. A standard 'two-cube' (2 cubic foot) moving box filled entirely with books can weigh over 80 pounds! Movers always recommend packing books in the smallest available boxes to keep them manageable.",
  "Fun Fact: When moving a refrigerator, it must be kept upright at all times. If it is tilted too far, the compressor oil can flow into the cooling lines. If this happens, the fridge must stand upright for 24 hours before being plugged in, or it will be destroyed.",
  "Did you know? The longest domestic move possible entirely within Canada's borders is from Cape Spear, Newfoundland, to the Yukon-Alaska border, covering a staggering driving distance of over 8,000 kilometers through some of the world's most rugged terrain.",
  "Fun Fact: Professional movers use a specialized technique called 'tiering' when loading a truck. They build solid walls of furniture and boxes from the floor to the ceiling, fitting pieces together like a giant game of Tetris to prevent any shifting during transit.",
  "Did you know? Mattress bags are not just for keeping your bed clean; they are essential for preventing the spread of bedbugs and allergens during a move. Many moving companies will refuse to load a mattress that is not properly sealed in plastic.",
  "Fun Fact: The first motorized moving trucks appeared in the early 1900s, replacing horse-drawn carriages. These early trucks had solid rubber tires and top speeds of only 15 miles per hour, making a cross-town move an all-day affair.",
  "Did you know? Moving insurance isn't technically 'insurance'—it's called 'valuation.' Standard released value protection in Canada only covers $0.60 per pound per article, meaning if a 10-pound flat-screen TV is broken, the standard payout is only $6.00!",
  "Fun Fact: The city of Toronto sees the highest volume of residential moves in Canada. With its dense population and booming condo market, movers in Toronto often have to navigate complex elevator reservations, tight alleyways, and strict parking enforcement.",
  "Did you know? When packing fragile items, crumpled newsprint is actually better than bubble wrap for filling empty voids in a box. The crumpled paper absorbs shock and prevents items from migrating toward the edges of the box where impacts occur.",
  "Fun Fact: Moving a pool table requires a certified billiard mechanic. The felt must be carefully removed, the heavy slate bed disassembled into three pieces, and the entire table re-leveled with precision instruments at the new destination.",
  "Did you know? In the dead of a Canadian winter, moving trucks can act like giant freezers. Items susceptible to freezing, like expensive wines, canned goods, and certain electronics, can be ruined if left in a parked moving truck overnight in sub-zero temperatures.",
  "Fun Fact: The 'four-wheel dolly' or 'furniture flat' used by movers is incredibly strong. A high-quality wooden mover's dolly with non-marking rubber casters can easily support and transport up to 1,000 pounds of weight across a flat surface.",
  "Did you know? When moving internationally from Canada to the USA, the moving truck must cross the border, but the customer must also cross the border and declare their goods in person at a US Customs and Border Protection office to clear the shipment.",
  "Fun Fact: The smell of a new home is often just the off-gassing of fresh paint and new carpets. Movers often recommend opening all windows and running the HVAC fan for at least 24 hours before moving your furniture in to help clear the indoor air quality.",
  "Did you know? Packing a kitchen takes the longest of any room in a house. The sheer volume of fragile dishes, oddly shaped appliances, and sharp utensils means the kitchen usually requires more boxes and packing paper than the living room and bedroom combined.",
  "Fun Fact: A professional moving crew of three people can typically load a standard three-bedroom home into a truck in about 4 to 6 hours. Doing the same job with a group of inexperienced friends usually takes an entire weekend and a lot of pizza.",
  "Did you know? The word 'luggage' comes from the verb 'lug', meaning to drag or pull a heavy object. It literally means 'what needs to be lugged'.",
  "Fun Fact: The average American moves 11.7 times in their lifetime, which is significantly more than the global average.",
  "Did you know? The most common item left behind during a move is the phone charger. Always double-check your wall outlets!",
  "Fun Fact: The ancient Romans had professional movers called 'saccarii' who would carry goods in large sacks from ships to warehouses.",
  "Did you know? Moving companies often use color-coded stickers to keep track of inventory. Each room gets a specific color to make unloading faster.",
  "Fun Fact: The largest residential move in history is believed to be the relocation of the entire town of Kiruna, Sweden, which is being moved building by building to avoid a collapsing mine.",
  "Did you know? You should never pack your important documents (passports, birth certificates, deeds) in the moving truck. Always keep them with you in your personal vehicle.",
  "Fun Fact: The 'wardrobe box' was originally designed for the theatrical industry to transport costumes without wrinkling them.",
  "Did you know? In Japan, some premium moving services will not only pack and move your belongings but will also clean your old apartment and set up your new one exactly as it was, down to the placement of items in your drawers.",
  "Fun Fact: The first cardboard box was invented in 1817 in England by Sir Malcolm Thornhill, but it wasn't corrugated.",
  "Did you know? Moving a waterbed requires completely draining it first. A full king-size waterbed can weigh over 2,000 pounds!",
  "Fun Fact: The busiest moving day of the year in the United States is typically the Friday before Labor Day weekend.",
  "Did you know? If you're moving a fish tank, you must transport the fish separately in specialized containers. The tank itself must be completely empty and dry to prevent the glass from cracking under the weight of sloshing water.",
  "Fun Fact: The term 'packing peanuts' refers to the shape of the expanded polystyrene foam pieces used for cushioning. They were invented in 1965 by Dow Chemical.",
  "Did you know? You can hire professional 'unpackers' who will empty all your boxes, organize your closets, and even stock your pantry after a move.",
  "Fun Fact: The longest recorded move of a single physical structure was the 1999 relocation of the Cape Hatteras Lighthouse in North Carolina, which was moved 2,900 feet inland to protect it from coastal erosion.",
  "Did you know? It is highly recommended to leave your dresser drawers full of clothes when moving, as long as the dresser is sturdy. Movers will simply wrap the entire dresser in shrink wrap.",
  "Fun Fact: The ancient Egyptians used wooden sledges lubricated with water poured on the sand to move massive stone blocks for the pyramids.",
  "Did you know? When moving a front-loading washing machine, you must install 'shipping bolts' to secure the drum. Without them, the suspension system can be severely damaged during transit.",
  "Fun Fact: The concept of a 'moving truck' became popular after World War I, when surplus military trucks were converted for civilian use.",
  "Did you know? Most moving companies will not transport perishable food. You should plan to eat, donate, or throw away the contents of your fridge before moving day.",
  "Fun Fact: The 'dolly' gets its name from a 19th-century tool used by dockworkers, which was affectionately named after a common girl's name of the era.",
  "Did you know? Moving can be a great time to declutter. The 'one-year rule' suggests that if you haven't used an item in a year, you should donate or sell it instead of moving it.",
  "Fun Fact: The first patent for bubble wrap was filed under the name 'Method for Making Laminated Cushioning Material'.",
  "Did you know? You should always pack a 'first-night box' containing essentials like toiletries, a change of clothes, basic tools, and toilet paper, so you don't have to dig through boxes on your first night.",
  "Fun Fact: The heaviest building ever moved intact was the Fu Gang Building in China, weighing 15,000 tons. It was moved 118 feet in 2001.",
  "Did you know? Moving companies often charge by weight for long-distance moves, but by the hour for local moves.",
  "Fun Fact: The tradition of giving a 'housewarming' gift originated in the days before central heating, when guests would literally bring firewood to warm the new home.",
  "Did you know? You should defrost your freezer at least 24 hours before moving day to prevent water damage to your other belongings.",
  "Fun Fact: The 'moving blanket' or 'furniture pad' is typically made of a cotton/polyester blend and is designed to absorb shock and prevent scratches.",
  "Did you know? It's a myth that you should use newspaper to wrap fine china. The ink can rub off and permanently stain the dishes. Use unprinted packing paper instead.",
  "Fun Fact: The largest moving company in the world is currently Sirva, which operates in over 170 countries.",
  "Did you know? When moving a flat-screen TV, it should always be kept upright. Laying it flat can cause the glass screen to crack under its own weight during transit.",
  "Fun Fact: The term 'relocation' was first used in the 17th century, derived from the Latin 'relocare', meaning 'to place again'.",
  "Did you know? You can get free moving boxes from local liquor stores, grocery stores, and bookstores, but be careful—they may not be as sturdy as specialized moving boxes.",
  "Fun Fact: The most commonly damaged item during a move is glassware, followed closely by electronics.",
  "Did you know? If you're moving a grandfather clock, you must remove the pendulum and weights before transporting it to prevent damage to the delicate internal mechanisms.",
  "Fun Fact: The concept of 'self-storage' dates back to ancient China, where people would store their valuables in clay pots in guarded underground pits.",
  "Did you know? Moving companies have a 'Do Not Ship' list that includes items like nail polish remover, matches, and car batteries due to their flammable or corrosive nature.",
  "Fun Fact: The first moving boxes were actually wooden crates. Cardboard didn't become the standard until the mid-20th century.",
  "Did you know? You should take photos of the back of your electronics before unplugging them so you know exactly how to reconnect the wires at your new home.",
  "Fun Fact: The 'piano board' used by movers is a specialized skid board covered in canvas and padding, designed specifically for strapping and sliding grand pianos.",
  "Did you know? It's customary to tip your movers if they do a good job. A standard tip is $20-$50 per mover for a full day's work.",
  "Fun Fact: The longest continuous move by a single person is believed to be a man who walked around the world, covering over 19,000 miles in 11 years.",
  "Did you know? You should always label your boxes on the sides, not the top. When boxes are stacked, you won't be able to read the top labels.",
  "Fun Fact: The 'shrink wrap' used by movers is actually 'stretch wrap'. Shrink wrap requires heat to shrink, while stretch wrap simply stretches and clings to itself.",
  "Did you know? Moving a hot tub requires specialized equipment, including a 'spa dolly' and sometimes even a crane if access is limited.",
  "Fun Fact: The tradition of carrying a bride over the threshold of a new home originated in ancient Rome to protect her from evil spirits lurking at the doorway.",
  "Did you know? You should pack your heaviest items in small boxes and lighter items in large boxes to make them easier to carry.",
  "Fun Fact: The first recorded use of a 'moving van' was in London in the 1840s, pulled by a team of horses.",
  "Did you know? The average cost of an interstate move in the US is around $4,300, while a local move averages about $1,250.",
  "Fun Fact: The busiest moving weekend of the entire year is typically the last weekend of July or the first weekend of August.",
  "Did you know? The word 'moving' comes from the Old French 'movoir', which means to set in motion or stir.",
  "Fun Fact: According to the US Census Bureau, about 27 million Americans move every year, which is roughly 8% of the population.",
  "Did you know? The most common reason people give for moving is to be closer to family, followed by a new job or job transfer.",
  "Fun Fact: The longest residential move possible within the continental US is from Key West, Florida, to Neah Bay, Washington—a staggering 3,500 miles!",
  "Did you know? Moving scams are unfortunately common. The 'hostage load' scam involves movers demanding more money than the estimate before unloading your belongings.",
  "Fun Fact: The heaviest item ever moved by road was a 4,800-ton water desalination unit in Saudi Arabia, requiring a specialized tractor with 172 axles.",
  "Did you know? In the UK, a 'chain' refers to a sequence of linked home purchases. If one person's sale falls through, the entire moving chain can collapse.",
  "Fun Fact: The first specialized moving boxes were created in the 1890s by the corrugated paper industry, originally to ship fragile glass bottles.",
  "Did you know? Moving a piano can throw it completely out of tune, not just from the bumping, but primarily due to changes in humidity and temperature in the new environment.",
  "Fun Fact: The 'pizza and beer' payment method for friends helping you move is a time-honored tradition, but professional movers usually prefer a cash tip of 15-20%.",
  "Did you know? The most forgotten items during a move are things hidden out of sight: items in the dishwasher, clothes at the dry cleaner, and hidden spare keys.",
  "Fun Fact: In ancient Rome, moving was a chaotic affair. The poet Martial complained about the noise of wagons moving goods through the narrow streets at night.",
  "Did you know? The psychological stress of moving is so high that researchers have found it can temporarily lower your immune system, making you more susceptible to colds.",
  "Fun Fact: The largest moving company in the US, United Van Lines, handles over 1 million moves per year.",
  "Did you know? You should never pack your moving boxes completely full of heavy items like books. A good rule of thumb is 'the heavier the item, the smaller the box'.",
  "Fun Fact: The term 'U-Haul' was coined by founder Leonard Shoen in 1945. He started the company with an initial investment of just $5,000.",
  "Did you know? If you're moving with a cat, experts recommend keeping them confined to one room in the new house for the first few days to help them acclimate slowly.",
  "Fun Fact: The 'bubble' in bubble wrap was originally intended to be a textured wallpaper. When it failed as decor, it found its true calling as the ultimate packing material.",
  "Did you know? Moving companies often use a 'cube sheet' to estimate the volume of your belongings. A standard sofa is usually estimated at around 50 cubic feet.",
  "Fun Fact: The most popular day to sign a new lease and move into an apartment is the 1st of the month, causing a massive spike in demand for rental trucks.",
  "Did you know? In Japan, it's customary to give your new neighbors a small gift, like a towel or a box of sweets, when you move in. It's called 'hikkoshi soba'.",
  "Fun Fact: The record for the heaviest building ever moved goes to the Fairmount Hotel in San Antonio, Texas. The 3.2-million-pound brick building was moved 6 blocks in 1985.",
  "Did you know? Moving a grandfather clock requires removing the pendulum and weights first. If left attached, they can swing and destroy the delicate internal gears during transit.",
  "Fun Fact: The concept of the 'moving blanket' dates back to the early 1900s when movers would use old quilts to protect furniture from the rough wooden sides of horse-drawn wagons.",
  "Did you know? You should never use duct tape to seal moving boxes. It doesn't adhere well to cardboard and can easily peel off in extreme temperatures.",
  "Fun Fact: The busiest moving route in the United States is consistently between New York and Florida, driven largely by retirees relocating to warmer climates.",
  "Did you know? Moving a refrigerator requires it to be kept upright. If tilted too much, the compressor oil can flow into the cooling lines, potentially ruining the appliance.",
  "Fun Fact: The term 'bill of lading' used in moving contracts originates from maritime law. It literally means a 'bill of loading' and serves as a legal receipt of freight services.",
  "Did you know? It is illegal for moving companies to transport hazardous materials, including everyday items like aerosol cans, paint thinner, and even some cleaning supplies.",
  "Fun Fact: Modern air-ride suspension trucks ensure that fragile items experience minimal vibration during long-haul transport, a massive upgrade from the leaf-spring suspensions of the past.",
  "Did you know? The golden rule of packing is to keep the weight of any single box under 50 pounds. Overpacking compromises the structural integrity of the cardboard, risking a blowout.",
  "Fun Fact: In 2014, a man in Utah moved his entire 3,000-square-foot house across a frozen lake to save money on transportation costs. It took two weeks and a lot of thick ice!",
  "Did you know? A great moving hack is to use your own linens, towels, and clothing to wrap fragile items. It saves money on packing materials and packs your clothes at the same time.",
  "Fun Fact: The heaviest residential item commonly moved is a large gun safe, which can weigh upwards of 1,000 to 1,500 pounds empty. Moving these requires specialized heavy-duty dollies and steel ramps.",
  "Did you know? When moving internationally, your belongings might be subjected to quarantine inspections. Australia, for example, strictly inspects outdoor furniture for soil and insects.",
  "Fun Fact: In some cultures, it's considered bad luck to bring an old broom into a new house. A new broom symbolizes sweeping away the old dirt and starting fresh.",
  "Did you know? The most stressful part of moving, according to surveys, isn't the heavy lifting—it's the packing and unpacking process.",
  "Fun Fact: Professional movers use a specialized technique called 'tiering' when loading a truck. They build solid walls of furniture and boxes from the floor to the ceiling to prevent shifting.",
  "Did you know? Donating unwanted items before a move not only lightens your load but can also provide a tax deduction. Just make sure to get a receipt from the charity.",
  "Fun Fact: The modern self-storage industry began in Texas in the 1960s. Today, there are more self-storage facilities in the US than McDonald's and Starbucks locations combined!",
  "Did you know? Moving houseplants across long distances can be fatal to them due to temperature shocks inside a dark moving truck. Many professional movers prohibit live plants for this reason.",
  "Fun Fact: A fully loaded 53-foot moving trailer can hold the contents of approximately three to four average-sized homes.",
  "Did you know? Color-coding your moving boxes with different colored tapes or markers for each room can speed up the unloading process significantly.",
  "Fun Fact: The global relocation and moving services market is estimated to be worth over $30 billion annually.",
  "Did you know? The original box your TV came in is the absolute best way to move it. If you didn't keep it, movers offer specialized, adjustable TV boxes with foam inserts.",
  "Fun Fact: In the 1800s, 'moving day' in New York City was May 1st. Almost everyone whose lease was up moved on the exact same day, causing massive chaos in the streets.",
  "Did you know? Liquor boxes are highly prized for moving because they are designed to hold heavy glass bottles and often come with cardboard dividers perfect for packing glasses.",
  "Fun Fact: According to insurance claims, the most frequently damaged items during a move are wooden furniture pieces, often suffering from scratches or dents during the loading process."
];

export const FunFactLoader: React.FC = () => {
  // Initialize with a random fact index
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * FUN_FACTS.length));
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const currentFact = FUN_FACTS[factIndex];
    let charIndex = 0;
    let currentText = ""; // Use a local variable to build the string to avoid React state batching bugs
    
    setIsTyping(true);
    setDisplayedText("");

    const typingInterval = setInterval(() => {
      if (charIndex < currentFact.length) {
        currentText += currentFact.charAt(charIndex);
        setDisplayedText(currentText);
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 20); // Faster typing speed since the facts are longer now

    return () => clearInterval(typingInterval);
  }, [factIndex]);

  useEffect(() => {
    if (!isTyping) {
      const nextFactTimer = setTimeout(() => {
        setFactIndex((prev) => {
          let nextIndex;
          // Ensure we don't pick the exact same fact twice in a row
          do {
            nextIndex = Math.floor(Math.random() * FUN_FACTS.length);
          } while (nextIndex === prev);
          return nextIndex;
        });
      }, 4000); // Wait 4 seconds before the next fact so they have time to read it
      return () => clearTimeout(nextFactTimer);
    }
  }, [isTyping]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full mb-8 shadow-[0_0_15px_rgba(140,29,29,0.3)]"
      />
      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-text-main dark:text-text-main-dark mb-4 uppercase tracking-widest"
      >
        Synthesizing Notes...
      </motion.h3>
      <div className="h-40 flex items-center justify-center max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.p 
            key={factIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg text-text-muted dark:text-text-muted-dark font-mono text-left leading-relaxed"
          >
            {displayedText}
            <span className="animate-pulse inline-block w-2 h-5 bg-accent-primary ml-1 align-middle"></span>
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
