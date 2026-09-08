# Client Review Interview Script
**Project Module:** Energy Monitoring & Alerts (Solar Share Co-op)  
**Interviewer (Student):** [Your Name]  
**Interviewee (Client):** [Client Name / Role]  
**Date:** [Insert Date]  

---

## Phase 1: Welcome & Introduction (3 minutes)

**Interviewer Script:**
> *"Thank you so much for taking the time to meet with me today. As part of the Software Engineering project for the Community Solar Co-op, my assigned module is the **Energy Monitoring & Alerts** system.*
>
> *Today, I want to show you the completed dashboard and alert interface. The goal of this module is to empower household members to track solar generation, monitor consumption, understand their energy balance, configure monthly usage budgets, and receive real-time notifications for high or unusual electricity consumption.*
>
> *I would love to walk you through a brief demo of the features and then get your honest feedback, comments, and ratings. This will help us evaluate the usability and value of the system."*

---

## Phase 2: Live Feature Walkthrough & Demo (7 minutes)

*Guide the client through the running application on your mobile screen or web browser. Read the prompts below as you show each screen.*

### Step 1: The Main Dashboard (Generation & Consumption)
> *"First, let's look at the main dashboard. At a single glance, you can monitor your electricity metrics. On the left card, you can view your live **Solar Generation** in kW, along with totals for today, this week, and this month.*
>
> *On the right card, you see your live **Energy Consumption**. Below them, the **Energy Balance Card** automatically calculates if you are in a **Surplus** (producing more than you use) or a **Deficit** (drawing power from the grid). When in a surplus, your excess clean energy is shared with other co-op households."*

### Step 2: Historical Trends & Monthly Usage Limit
> *"Scroll down a bit. The **Energy Usage Trends** chart displays a visual comparison of your generation versus consumption over the last 7 intervals, allowing you to identify usage patterns.*
>
> *Below the chart, the **Monthly Limit** tracking bar displays how close you are to your energy budget. Notice that the bar changes color dynamically—green for normal, yellow/orange for warnings, and red once you exceed your limit."*

### Step 3: Configuring the Budget Limit
> *"If we click **'Configure Limit'**, it takes us to the settings screen. Here, you can adjust your household's monthly energy budget (in kWh) and set a warning threshold percentage (e.g. 80%). Let's try changing this to 400 kWh and saving it."*
*(Perform the save action and navigate back to show the updated progress bar)*

### Step 4: System Alerts Log & History
> *"Now let's click **'Alert History'**. This page records any alerts triggered by the system. The system automatically performs two main checks:*
> 1. *It warns you when your monthly consumption crosses your budget thresholds (80%, 90%, 100%).*
> 2. *It runs anomaly-detection: comparing your live usage against your typical 20-reading average. If usage spikes to 3x or more of your typical average, it flags it as 'Unusual Consumption' (for example, if an AC unit or heater was left on).*
>
> *On this screen, you can mark alerts as read or delete old logs to keep your list clean."*

---

## Phase 3: Feedback & Usability Questions (10 minutes)

*Ask the client the following open-ended questions and write down their answers:*

### 1. General Impression & Layout
* **Question:** *"What are your first impressions of the overall layout, visual aesthetics, and color scheme of the Solar Share dashboard?"*
* **Client Response Notes:**  
  \
  \
  

### 2. Clarity of Information
* **Question:** *"Is the energy data (kW vs. kWh, Surplus vs. Deficit, Solar vs. Consumption) presented clearly? Did you find the Energy Balance color-codes (Green for Surplus, Rose for Deficit) helpful?"*
* **Client Response Notes:**  
  \
  \
  

### 3. Usability of Settings & Alerts
* **Question:** *"How intuitive did you find the process of configuring the monthly limits? Do you feel that receiving alerts for 'Unusual Consumption' (like appliance spikes) is valuable for a household?"*
* **Client Response Notes:**  
  \
  \
  

### 4. Missing Features & Improvements
* **Question:** *"Are there any additional features, details, or layout changes you would recommend to make this tool more useful for a community solar cooperative?"*
* **Client Response Notes:**  
  \
  \
  

---

## Phase 4: Quantitative Review Questionnaire (3 minutes)

*Ask the client to rate the following items on a scale of **1 to 5** (1 = Strongly Disagree/Poor, 5 = Strongly Agree/Excellent):*

| Metric / Statement | Rating (1 - 5) | Comments |
| :--- | :---: | :--- |
| **1. Ease of Navigation:** The app is easy to navigate between the dashboard, limits configuration, and alert logs. | | |
| **2. Aesthetic Appeal:** The color scheme, rounded cards, and visual charts look modern and professional. | | |
| **3. Information Value:** The generation, consumption, and balance summaries provide high value for tracking energy. | | |
| **4. Usefulness of Alerts:** The budget warnings and anomaly alerts are useful for preventing high bills and waste. | | |
| **5. Responsiveness:** The screens scale and load quickly and fit the device viewport correctly. | | |

---

## Phase 5: Closing (1 minute)

**Interviewer Script:**
> *"That concludes our review session. Your ratings and feedback are incredibly valuable and will be documented in our software engineering project report. Thank you again for your time and guidance!"*
