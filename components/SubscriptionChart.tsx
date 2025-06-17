import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

type ChartDataItem = {
  category: string;
  amount: number;
  color: string;
};

type SubscriptionChartProps = {
  data: ChartDataItem[];
};

export default function SubscriptionChart({ data }: SubscriptionChartProps) {
  if (!data || data.length === 0) {
    return <View style={styles.container} />;
  }
  
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  
  let startAngle = 0;
  const paths = data.map((item, index) => {
    const percentage = item.amount / total;
    const endAngle = startAngle + percentage * 2 * Math.PI;
    
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const labelAngle = startAngle + (endAngle - startAngle) / 2;
    const labelRadius = radius * 0.7;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);
    
    const largeArcFlag = percentage > 0.5 ? 1 : 0;
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    const path = (
      <G key={index}>
        <Path d={pathData} fill={item.color} />
        {/* {percentage > 0.1 && (
          <SvgText
            x={labelX}
            y={labelY}
            fontSize="12"
            fontWeight="bold"
            fill="white"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {`${Math.round(percentage * 100)}%`}
          </SvgText>
        )} */}
      </G>
    );
    
    startAngle = endAngle;
    return path;
  });

  return (
    <View style={styles.container}>
      <Svg width={200} height={200} viewBox="0 0 200 200">
        {paths}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
});