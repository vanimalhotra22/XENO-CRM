export function personalizeMessage(template, profile) {
  let message = template;
  // Replace {{name}}
  message = message.replace(/\{\{name\}\}/g, profile.name);
  // Replace {{firstName}}
  const firstName = profile.name.split(" ")[0] || "";
  message = message.replace(/\{\{firstName\}\}/g, firstName);
  // Replace {{city}}
  message = message.replace(/\{\{city\}\}/g, profile.city || "your city");
  // Replace {{totalSpent}}
  message = message.replace(
    /\{\{totalSpent\}\}/g,
    `₹${profile.totalSpent.toLocaleString("en-IN")}`,
  );
  // Replace {{lastPurchase}}
  let lastPurchaseStr = "no previous purchase";
  if (profile.lastOrderDaysAgo !== 9999) {
    if (profile.lastOrderDaysAgo === 0) {
      lastPurchaseStr = "today";
    } else if (profile.lastOrderDaysAgo === 1) {
      lastPurchaseStr = "yesterday";
    } else {
      lastPurchaseStr = `${profile.lastOrderDaysAgo} days ago`;
    }
  }
  message = message.replace(/\{\{lastPurchase\}\}/g, lastPurchaseStr);
  return message;
}
