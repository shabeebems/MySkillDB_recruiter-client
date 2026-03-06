import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getRequest, postRequest } from '../../../../api/apiRequests';

export const useFlipCards = () => {
  const [flipCards, setFlipCards] = useState([]);
  const [isLoadingFlipCards, setIsLoadingFlipCards] = useState(false);
  const [flipCardResult, setFlipCardResult] = useState(null);
  const [transformedFlipCards, setTransformedFlipCards] = useState([]);
  const [currentFlipCardIndex, setCurrentFlipCardIndex] = useState(0);
  const [isFlipCardFlipped, setIsFlipCardFlipped] = useState(false);
  const [selectedFlipCardAnswer, setSelectedFlipCardAnswer] = useState(null);
  const [allFlipCardAnswers, setAllFlipCardAnswers] = useState({});
  const [showFlipCardResult, setShowFlipCardResult] = useState(false);
  const [flipCardResultData, setFlipCardResultData] = useState(null);
  const [isFlipCardActive, setIsFlipCardActive] = useState(false);
  const [isSubmittingFlipCards, setIsSubmittingFlipCards] = useState(false);

  const fetchJobFlipCards = async (jobId) => {
    if (!jobId) {
      setFlipCards([]);
      setFlipCardResult(null);
      return;
    }

    try {
      setIsLoadingFlipCards(true);
      const [flipCardsResponse, resultsResponse] = await Promise.all([
        getRequest(`/flip-cards/job/${jobId}`),
        getRequest('/job-flip-card-results/student')
      ]);
      
      if (flipCardsResponse.data?.success && flipCardsResponse.data?.data) {
        setFlipCards(flipCardsResponse.data.data || []);
      } else {
        setFlipCards([]);
      }

      if (resultsResponse.data?.success && resultsResponse.data?.data) {
        const resultsMap = resultsResponse.data.data;
        const jobResult = resultsMap[jobId];
        if (jobResult) {
          setFlipCardResult({
            completionPercentage: jobResult.completionPercentage || 0,
            stars: jobResult.stars || 0
          });
        } else {
          setFlipCardResult(null);
        }
      } else {
        setFlipCardResult(null);
      }
    } catch (error) {
      console.error('Error fetching flip cards:', error);
      setFlipCards([]);
      setFlipCardResult(null);
    } finally {
      setIsLoadingFlipCards(false);
    }
  };

  const handleStartFlipCards = () => {
    if (flipCards.length === 0) {
      toast.error('No flip cards available');
      return;
    }

    const transformed = flipCards.map((card) => {
      const correctIndex = card.options.findIndex(opt => opt === card.correctAnswer);
      
      return {
        id: card._id || card.id,
        front: {
          title: card.heading || '',
          content: card.content || '',
          keyPoint: card.keypoints?.[0] || ''
        },
        back: {
          question: card.question || '',
          options: card.options || [],
          correctIndex: correctIndex >= 0 ? correctIndex : 0
        }
      };
    });

    setTransformedFlipCards(transformed);
    setCurrentFlipCardIndex(0);
    setIsFlipCardFlipped(false);
    setSelectedFlipCardAnswer(null);
    setAllFlipCardAnswers({});
    setShowFlipCardResult(false);
    setFlipCardResultData(null);
    setIsFlipCardActive(true);
  };

  const handleFlipCardFlip = () => {
    setIsFlipCardFlipped(!isFlipCardFlipped);
    if (isFlipCardFlipped) {
      setSelectedFlipCardAnswer(null);
    }
  };

  const handleFlipCardOptionSelect = (optionIndex) => {
    setSelectedFlipCardAnswer(optionIndex);
  };

  const handleNextFlipCard = () => {
    if (selectedFlipCardAnswer !== null) {
      const currentCard = transformedFlipCards[currentFlipCardIndex];
      setAllFlipCardAnswers(prev => ({
        ...prev,
        [currentCard.id]: selectedFlipCardAnswer
      }));

      if (currentFlipCardIndex < transformedFlipCards.length - 1) {
        const newIndex = currentFlipCardIndex + 1;
        setCurrentFlipCardIndex(newIndex);
        setIsFlipCardFlipped(false);
        const nextCard = transformedFlipCards[newIndex];
        setSelectedFlipCardAnswer(allFlipCardAnswers[nextCard.id] || null);
      }
    }
  };

  const handlePreviousFlipCard = () => {
    if (currentFlipCardIndex > 0) {
      if (selectedFlipCardAnswer !== null) {
        const currentCard = transformedFlipCards[currentFlipCardIndex];
        setAllFlipCardAnswers(prev => ({
          ...prev,
          [currentCard.id]: selectedFlipCardAnswer
        }));
      }
      
      const newIndex = currentFlipCardIndex - 1;
      setCurrentFlipCardIndex(newIndex);
      setIsFlipCardFlipped(false);
      const prevCard = transformedFlipCards[newIndex];
      setSelectedFlipCardAnswer(allFlipCardAnswers[prevCard.id] || null);
    }
  };

  const handleCompleteFlipCards = async (viewingJobId) => {
    if (selectedFlipCardAnswer === null) {
      toast.error('Please select an answer');
      return;
    }

    try {
      setIsSubmittingFlipCards(true);
      
      const currentCard = transformedFlipCards[currentFlipCardIndex];
      const finalAnswers = {
        ...allFlipCardAnswers,
        [currentCard.id]: selectedFlipCardAnswer
      };

      let correctCount = 0;
      let incorrectCount = 0;

      transformedFlipCards.forEach((card) => {
        const userAnswer = finalAnswers[card.id];
        if (userAnswer !== undefined && userAnswer !== null) {
          if (userAnswer === card.back.correctIndex) {
            correctCount++;
          } else {
            incorrectCount++;
          }
        }
      });

      const totalFlipCards = transformedFlipCards.length;
      const completionPercentage = totalFlipCards > 0 
        ? Math.round((correctCount / totalFlipCards) * 100) 
        : 0;

      try {
        await postRequest('/job-flip-card-results', {
          jobId: viewingJobId,
          totalFlipCards,
          correctCount,
          incorrectCount,
          completionPercentage
        });
        
        const stars = (completionPercentage / 100) * 5;
        setFlipCardResult({
          completionPercentage,
          stars
        });
        
        try {
          const resultsResponse = await getRequest('/job-flip-card-results/student');
          if (resultsResponse.data?.success && resultsResponse.data?.data) {
            const resultsMap = resultsResponse.data.data;
            const jobResult = resultsMap[viewingJobId];
            if (jobResult) {
              setFlipCardResult({
                completionPercentage: jobResult.completionPercentage || 0,
                stars: jobResult.stars || 0
              });
            }
          }
        } catch (error) {
          console.error('Error refreshing flip card results:', error);
        }
      } catch (error) {
        console.error('Error submitting flip card results:', error);
      }

      setFlipCardResultData({
        correctCount,
        incorrectCount,
        completionPercentage
      });
      setShowFlipCardResult(true);
    } catch (error) {
      console.error('Error completing flip cards:', error);
      toast.error('Failed to complete flip cards');
    } finally {
      setIsSubmittingFlipCards(false);
    }
  };

  const handleRetryFlipCards = () => {
    setCurrentFlipCardIndex(0);
    setIsFlipCardFlipped(false);
    setSelectedFlipCardAnswer(null);
    setAllFlipCardAnswers({});
    setShowFlipCardResult(false);
    setFlipCardResultData(null);
  };

  const handleCloseFlipCards = () => {
    setIsFlipCardActive(false);
    setCurrentFlipCardIndex(0);
    setIsFlipCardFlipped(false);
    setSelectedFlipCardAnswer(null);
    setAllFlipCardAnswers({});
    setShowFlipCardResult(false);
    setFlipCardResultData(null);
  };

  return {
    flipCards,
    isLoadingFlipCards,
    flipCardResult,
    transformedFlipCards,
    currentFlipCardIndex,
    isFlipCardFlipped,
    selectedFlipCardAnswer,
    allFlipCardAnswers,
    showFlipCardResult,
    flipCardResultData,
    isFlipCardActive,
    isSubmittingFlipCards,
    fetchJobFlipCards,
    handleStartFlipCards,
    handleFlipCardFlip,
    handleFlipCardOptionSelect,
    handleNextFlipCard,
    handlePreviousFlipCard,
    handleCompleteFlipCards,
    handleRetryFlipCards,
    handleCloseFlipCards,
    setFlipCards,
    setFlipCardResult
  };
};

